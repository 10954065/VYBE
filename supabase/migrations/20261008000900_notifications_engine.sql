-- Phase 8: the engine that actually writes to `notifications` and
-- `notification_preferences`, which have existed since Phase 2 with nothing
-- ever inserting into them. Same shape as the Phase 7 gamification pass:
-- real triggers reacting to real actions, server-side only, nothing
-- client-writable. See docs/notifications.md.

-- Two notification types this pass adds that the original enum didn't
-- anticipate (badges didn't exist as a concept yet when Phase 2 wrote this
-- constraint), plus the preference toggle each one needs.
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (
    type in (
      'like', 'comment', 'follow', 'crew_activity', 'event_reminder',
      'challenge_completed', 'streak_milestone', 'xp_milestone', 'recommendation',
      'badge_earned'
    )
  );

alter table public.notification_preferences
  add column xp_milestones boolean not null default true,
  add column badges boolean not null default true;

-- Real, asynchronous HTTP calls from inside a trigger — the same
-- "everything server-side lives in Postgres" posture as the rest of this
-- project, no edge function or external worker needed.
create extension if not exists pg_net;

-- Defense in depth: PostgREST only exposes RPCs from the public schema, so
-- net.http_post was never reachable over the API either way, but every
-- other internal primitive in this project explicitly revokes execute from
-- anon/authenticated rather than relying on that — match the pattern.
revoke execute on function net.http_post(text, jsonb, jsonb, jsonb, integer) from public, anon, authenticated;
revoke execute on function net.http_get(text, jsonb, jsonb, integer) from public, anon, authenticated;

-- Pure math, no table access — port of packages/shared's levelForXp. Must
-- stay in sync with LEVEL_THRESHOLDS' `50*i*(i+1)` curve there.
create or replace function public.level_for_xp(p_total_xp bigint)
returns integer
language sql
stable
as $$
  select 1 + count(*)::integer
  from generate_series(1, 99) as i
  where p_total_xp >= (50 * i * (i + 1));
$$;

-- Internal primitive: pushes to every device registered for a user, via
-- Expo's push service. Fire-and-forget (net.http_post is async; this
-- project doesn't read net._http_response — a dropped push degrades to
-- "the in-app notification is still there," never a hard failure). Not a
-- public RPC — see the revoke at the bottom of this file.
create or replace function public.send_push_notification(p_user_id uuid, p_title text, p_body text, p_data jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_push_enabled boolean;
  v_token record;
begin
  select push_enabled into v_push_enabled from public.notification_preferences where user_id = p_user_id;
  if v_push_enabled is false then
    return;
  end if;

  for v_token in select token from public.push_tokens where user_id = p_user_id loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := jsonb_build_object('to', v_token.token, 'title', p_title, 'body', p_body, 'data', p_data)
    );
  end loop;
end;
$$;

-- Internal primitive: the single write path for every notification in this
-- project. Resolves the right notification_preferences column for the
-- type, skips entirely if the user has that category off or the action was
-- a no-op self-notification (reacting to your own post, etc.), inserts the
-- in-app row, then best-effort pushes. Not a public RPC.
create or replace function public.create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_target_type text,
  p_target_id uuid,
  p_body text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefs public.notification_preferences;
  v_enabled boolean;
  v_actor_name text;
  v_push_body text;
begin
  if p_actor_id is not null and p_actor_id = p_user_id then
    return;
  end if;

  select * into v_prefs from public.notification_preferences where user_id = p_user_id;

  v_enabled := case p_type
    when 'follow' then v_prefs.follows
    when 'like' then v_prefs.likes
    when 'comment' then v_prefs.comments
    when 'crew_activity' then v_prefs.crew_activity
    when 'event_reminder' then v_prefs.event_reminders
    when 'challenge_completed' then v_prefs.challenges
    when 'streak_milestone' then v_prefs.streaks
    when 'xp_milestone' then v_prefs.xp_milestones
    when 'badge_earned' then v_prefs.badges
    when 'recommendation' then v_prefs.recommendations
    else true
  end;

  if v_prefs is not null and v_enabled is false then
    return;
  end if;

  insert into public.notifications (user_id, actor_id, type, target_type, target_id, body)
  values (p_user_id, p_actor_id, p_type, p_target_type, p_target_id, p_body);

  if p_actor_id is not null then
    select display_name into v_actor_name from public.profiles where id = p_actor_id;
  end if;
  v_actor_name := coalesce(v_actor_name, 'Someone');

  v_push_body := coalesce(p_body, case p_type
    when 'follow' then v_actor_name || ' started following you'
    when 'like' then v_actor_name || ' reacted to your ' || coalesce(p_target_type, 'post')
    when 'comment' then v_actor_name || ' commented on your post'
    when 'crew_activity' then 'Crew activity update'
    when 'event_reminder' then 'An event you''re going to starts soon'
    when 'challenge_completed' then 'You completed a challenge!'
    when 'streak_milestone' then 'Streak milestone reached!'
    when 'xp_milestone' then 'You leveled up!'
    when 'badge_earned' then 'You earned a new badge!'
    else 'You have a new notification'
  end);

  perform public.send_push_notification(p_user_id, 'VYBE', v_push_body);
end;
$$;

-- follows: notify the person being followed.
create or replace function public.handle_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(new.following_id, new.follower_id, 'follow', 'profile', new.follower_id, null);
  return new;
end;
$$;

create trigger handle_follow_notification
  after insert on public.follows
  for each row execute function public.handle_follow_notification();

-- reactions: notify whoever owns the post/comment/check-in reacted to.
-- Mirrors handle_reaction_gamification's target resolution, but also covers
-- comment reactions (the gamification engine deliberately doesn't award XP
-- for those — see that migration — but a notification is still real here).
create or replace function public.handle_reaction_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_target_type text;
  v_target_id uuid;
begin
  if new.post_id is not null then
    select author_id into v_owner_id from public.posts where id = new.post_id;
    v_target_type := 'post';
    v_target_id := new.post_id;
  elsif new.comment_id is not null then
    select author_id into v_owner_id from public.comments where id = new.comment_id;
    v_target_type := 'comment';
    v_target_id := new.comment_id;
  elsif new.check_in_id is not null then
    select user_id into v_owner_id from public.check_ins where id = new.check_in_id;
    v_target_type := 'check_in';
    v_target_id := new.check_in_id;
  end if;

  if v_owner_id is not null then
    perform public.create_notification(v_owner_id, new.user_id, 'like', v_target_type, v_target_id, null);
  end if;

  return new;
end;
$$;

create trigger handle_reaction_notification
  after insert on public.reactions
  for each row execute function public.handle_reaction_notification();

-- comments: notify the post's author.
create or replace function public.handle_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_author_id uuid;
begin
  select author_id into v_post_author_id from public.posts where id = new.post_id;
  if v_post_author_id is not null then
    perform public.create_notification(v_post_author_id, new.author_id, 'comment', 'post', new.post_id, left(new.body, 140));
  end if;
  return new;
end;
$$;

create trigger handle_comment_notification
  after insert on public.comments
  for each row execute function public.handle_comment_notification();

-- crew_members: three distinct moments, all real actions already possible
-- through the existing crew admin flows (crews.md) — a join request lands
-- (notify every admin/owner), a pending request gets approved (notify the
-- requester), or an admin deletes a still-pending row, i.e. rejects it
-- (notify the requester; guarded against the requester cancelling their own
-- request, which is the same DELETE shape with a different actor).
create or replace function public.handle_crew_join_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin record;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  for v_admin in
    select user_id from public.crew_members
    where crew_id = new.crew_id and role in ('admin', 'owner') and status = 'approved'
  loop
    perform public.create_notification(v_admin.user_id, new.user_id, 'crew_activity', 'crew', new.crew_id, 'requested to join your crew');
  end loop;

  return new;
end;
$$;

create trigger handle_crew_join_request_notification
  after insert on public.crew_members
  for each row execute function public.handle_crew_join_request_notification();

create or replace function public.handle_crew_join_decision_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' and new.status = 'approved' then
    perform public.create_notification(new.user_id, null, 'crew_activity', 'crew', new.crew_id, 'Your request to join was approved');
  end if;
  return new;
end;
$$;

create trigger handle_crew_join_decision_notification
  after update on public.crew_members
  for each row execute function public.handle_crew_join_decision_notification();

create or replace function public.handle_crew_join_rejected_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' and auth.uid() is not null and auth.uid() <> old.user_id then
    perform public.create_notification(old.user_id, auth.uid(), 'crew_activity', 'crew', old.crew_id, 'Your request to join was declined');
  end if;
  return null;
end;
$$;

create trigger handle_crew_join_rejected_notification
  after delete on public.crew_members
  for each row execute function public.handle_crew_join_rejected_notification();

-- xp_transactions: two independent things can be true of the same row —
-- it might be the payout for completing a challenge, and/or it might be
-- the row that pushed the user's total XP over a level boundary.
create or replace function public.handle_challenge_completed_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if new.reason <> 'complete_challenge' then
    return new;
  end if;

  select title into v_title from public.challenges where id = new.reference_id;
  perform public.create_notification(new.user_id, null, 'challenge_completed', 'challenge', new.reference_id, coalesce(v_title, 'Challenge complete'));
  return new;
end;
$$;

create trigger handle_challenge_completed_notification
  after insert on public.xp_transactions
  for each row execute function public.handle_challenge_completed_notification();

create or replace function public.handle_xp_level_up_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_after bigint;
  v_total_before bigint;
  v_level_before integer;
  v_level_after integer;
begin
  select coalesce(sum(amount), 0) into v_total_after from public.xp_transactions where user_id = new.user_id;
  v_total_before := v_total_after - new.amount;

  v_level_before := public.level_for_xp(v_total_before);
  v_level_after := public.level_for_xp(v_total_after);

  if v_level_after > v_level_before then
    perform public.create_notification(new.user_id, null, 'xp_milestone', null, null, 'Level ' || v_level_after);
  end if;

  return new;
end;
$$;

create trigger handle_xp_level_up_notification
  after insert on public.xp_transactions
  for each row execute function public.handle_xp_level_up_notification();

-- streaks: notify the first time current_count reaches one of these
-- round-number milestones. A plain `=` check would miss a jump (there
-- isn't one today — touch_outside_streak only ever increments by 1 — but
-- a `between old and new` range check costs nothing and doesn't assume
-- that stays true forever).
create or replace function public.handle_streak_milestone_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestones integer[] := array[3, 7, 14, 30, 60, 100];
  v_milestone integer;
begin
  if new.current_count <= old.current_count then
    return new;
  end if;

  foreach v_milestone in array v_milestones loop
    if old.current_count < v_milestone and new.current_count >= v_milestone then
      perform public.create_notification(new.user_id, null, 'streak_milestone', 'streak', null, new.current_count || '-day streak!');
    end if;
  end loop;

  return new;
end;
$$;

create trigger handle_streak_milestone_notification
  after update on public.streaks
  for each row execute function public.handle_streak_milestone_notification();

-- user_badges: notify on every newly earned badge.
create or replace function public.handle_badge_earned_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badge_name text;
begin
  select name into v_badge_name from public.badges where id = new.badge_id;
  perform public.create_notification(new.user_id, null, 'badge_earned', 'badge', new.badge_id, coalesce(v_badge_name, 'New badge'));
  return new;
end;
$$;

create trigger handle_badge_earned_notification
  after insert on public.user_badges
  for each row execute function public.handle_badge_earned_notification();

-- create_notification/send_push_notification are internal primitives called
-- by the triggers above, never meant to be called directly by a client —
-- same reasoning and same pattern as award_xp/touch_outside_streak/
-- evaluate_badges in the gamification engine.
revoke execute on function public.create_notification(uuid, uuid, text, text, uuid, text) from public, anon, authenticated;
revoke execute on function public.send_push_notification(uuid, text, text, jsonb) from public, anon, authenticated;
