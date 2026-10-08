-- Phase 7, pulled forward: the engine that actually writes to the
-- gamification tables the Phase 2 migration created. Until now nothing
-- awarded XP except complete_onboarding's one-time +100. This migration
-- adds real triggers reacting to real actions (check-ins, posts, crew
-- joins, event attendance, reactions received), a real streak computation,
-- and real badge-unlock evaluation. All of it is SECURITY DEFINER,
-- trigger-driven server-side logic — xp_transactions/streaks/badges/
-- user_badges still have no client insert policy, by design.

-- Internal primitive: records one XP transaction. Not a public RPC — see
-- the revokes at the bottom of this file. Trigger functions call it with
-- perform, never exposing it to a client-supplied user_id.
create or replace function public.award_xp(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_type text default null,
  p_reference_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.xp_transactions (user_id, amount, reason, reference_type, reference_id)
  values (p_user_id, p_amount, p_reason, p_reference_type, p_reference_id);
end;
$$;

-- Internal primitive: updates (or creates) the user's 'outside' streak for
-- a given activity date. Only 'outside' is wired up in this pass — 'social'/
-- 'explorer'/'event' streak_types exist in the schema but have no real
-- trigger yet, same honesty-over-completeness call as everywhere else in
-- this project. Not a public RPC.
create or replace function public.touch_outside_streak(p_user_id uuid, p_activity_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last_date date;
  v_current integer;
  v_longest integer;
begin
  select last_activity_date, current_count, longest_count
    into v_last_date, v_current, v_longest
  from public.streaks
  where user_id = p_user_id and streak_type = 'outside'
  for update;

  if v_last_date is null then
    insert into public.streaks (user_id, streak_type, current_count, longest_count, last_activity_date, is_active)
    values (p_user_id, 'outside', 1, 1, p_activity_date, true);
    return;
  end if;

  if v_last_date = p_activity_date then
    return;
  elsif v_last_date = p_activity_date - 1 then
    v_current := v_current + 1;
  else
    v_current := 1;
  end if;

  v_longest := greatest(v_longest, v_current);

  update public.streaks
  set current_count = v_current,
      longest_count = v_longest,
      last_activity_date = p_activity_date,
      is_active = true
  where user_id = p_user_id and streak_type = 'outside';
end;
$$;

-- Internal primitive: evaluates every BADGE_SLUGS criterion for one user
-- and awards any newly-earned badge. Called after every gamification-
-- relevant action rather than on a schedule — cheap idempotent checks, no
-- cron infrastructure exists in this project. Not a public RPC.
--
-- Criteria are intentionally the generic, verifiable kind (counts, ranks,
-- day-of-week math) — not the Stitch export's flavor-text badges
-- ("Accra Foodie", "Amapiano Head"), which had no generalizable rule
-- behind them and were dropped rather than faked. See docs/gamification.md.
create or replace function public.evaluate_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkin_count integer;
  v_distinct_places integer;
  v_post_count integer;
  v_weekend_checkins integer;
  v_built_crew boolean;
  v_event_count integer;
  v_signup_rank bigint;
begin
  select count(*) into v_checkin_count from public.check_ins where user_id = p_user_id;
  if v_checkin_count >= 1 then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.slug = 'first_check_in'
    on conflict do nothing;
  end if;

  select count(distinct place_id) into v_distinct_places
  from public.check_ins where user_id = p_user_id and place_id is not null;
  if v_distinct_places >= 10 then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.slug = 'explorer'
    on conflict do nothing;
  end if;

  select count(*) into v_post_count from public.posts where author_id = p_user_id and deleted_at is null;
  if v_post_count >= 1 then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.slug = 'social_starter'
    on conflict do nothing;
  end if;

  select count(*) into v_weekend_checkins
  from public.check_ins
  where user_id = p_user_id and extract(isodow from created_at) in (5, 6);
  if v_weekend_checkins >= 4 then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.slug = 'weekend_warrior'
    on conflict do nothing;
  end if;

  -- Counts live crew_members rows directly rather than crews.member_count,
  -- so this is correct regardless of trigger firing order on crew_members.
  select exists (
    select 1 from public.crews c
    where c.creator_id = p_user_id
      and (select count(*) from public.crew_members cm where cm.crew_id = c.id and cm.status = 'approved') >= 5
  ) into v_built_crew;
  if v_built_crew then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.slug = 'crew_builder'
    on conflict do nothing;
  end if;

  select count(distinct event_id) into v_event_count
  from public.check_ins where user_id = p_user_id and event_id is not null;
  if v_event_count >= 5 then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.slug = 'event_regular'
    on conflict do nothing;
  end if;

  select count(*) into v_signup_rank
  from public.profiles
  where created_at <= (select created_at from public.profiles where id = p_user_id);
  if v_signup_rank <= 500 then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.slug = 'early_vyber'
    on conflict do nothing;
  end if;
end;
$$;

-- Seed the 7 badges BADGE_SLUGS already names in packages/shared. icon_url
-- stays null — there is no real badge artwork, and this project doesn't
-- fabricate placeholder images for it; the mobile app maps slug -> emoji
-- locally (packages/shared's BADGE_ICONS).
insert into public.badges (slug, name, description, criteria) values
  ('first_check_in', 'First Check-In', 'Checked in somewhere for the first time.', '{"metric": "check_in_count", "threshold": 1}'),
  ('explorer', 'Explorer', 'Checked in at 10 different places.', '{"metric": "distinct_place_check_ins", "threshold": 10}'),
  ('social_starter', 'Social Starter', 'Shared your first post.', '{"metric": "post_count", "threshold": 1}'),
  ('weekend_warrior', 'Weekend Warrior', 'Checked in 4+ times on a Friday or Saturday.', '{"metric": "weekend_check_ins", "threshold": 4}'),
  ('crew_builder', 'Crew Builder', 'Built a crew that grew to 5+ members.', '{"metric": "owned_crew_member_count", "threshold": 5}'),
  ('event_regular', 'Event Regular', 'Checked in at 5 different events.', '{"metric": "distinct_event_check_ins", "threshold": 5}'),
  ('early_vyber', 'Early Vyber', 'One of the first 500 people on VYBE.', '{"metric": "signup_rank", "threshold": 500}')
on conflict (slug) do nothing;

-- check_ins: 10 XP always, +20 more the first time this user checks into
-- this specific place, then touch the outside streak and re-evaluate badges.
create or replace function public.handle_check_in_gamification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_new_place boolean := false;
begin
  if new.place_id is not null then
    select not exists (
      select 1 from public.check_ins
      where user_id = new.user_id and place_id = new.place_id and id <> new.id
    ) into v_is_new_place;
  end if;

  perform public.award_xp(new.user_id, 10, 'check_in', 'check_in', new.id);

  if v_is_new_place then
    perform public.award_xp(new.user_id, 20, 'explore_new_place', 'place', new.place_id);
  end if;

  perform public.touch_outside_streak(new.user_id, new.created_at::date);
  perform public.evaluate_badges(new.user_id);

  return new;
end;
$$;

create trigger handle_check_in_gamification
  after insert on public.check_ins
  for each row execute function public.handle_check_in_gamification();

-- posts: 5 XP per post.
create or replace function public.handle_post_gamification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_xp(new.author_id, 5, 'create_post', 'post', new.id);
  perform public.evaluate_badges(new.author_id);
  return new;
end;
$$;

create trigger handle_post_gamification
  after insert on public.posts
  for each row execute function public.handle_post_gamification();

-- crew_members: 15 XP the first time a membership reaches 'approved' for a
-- given (user, crew) pair — guarded via xp_transactions so leave/rejoin
-- doesn't farm XP. Also re-checks the crew creator's crew_builder badge,
-- since member_count crossing 5 happens on someone else's join, not theirs.
create or replace function public.handle_crew_member_gamification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_awarded boolean;
  v_creator_id uuid;
begin
  if new.status <> 'approved' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'approved' then
    return new;
  end if;

  select exists (
    select 1 from public.xp_transactions
    where user_id = new.user_id and reason = 'join_crew' and reference_type = 'crew' and reference_id = new.crew_id
  ) into v_already_awarded;

  if not v_already_awarded then
    perform public.award_xp(new.user_id, 15, 'join_crew', 'crew', new.crew_id);
    perform public.evaluate_badges(new.user_id);
  end if;

  select creator_id into v_creator_id from public.crews where id = new.crew_id;
  if v_creator_id is not null and v_creator_id <> new.user_id then
    perform public.evaluate_badges(v_creator_id);
  end if;

  return new;
end;
$$;

create trigger handle_crew_member_gamification
  after insert or update on public.crew_members
  for each row execute function public.handle_crew_member_gamification();

-- event_attendees: 25 XP the first time a user reaches 'going' or
-- 'checked_in' for a given event — guarded the same way as crew joins so
-- going -> checked_in (two separate status transitions) only pays once.
create or replace function public.handle_event_attendee_gamification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_awarded boolean;
begin
  if new.status not in ('going', 'checked_in') then
    return new;
  end if;

  select exists (
    select 1 from public.xp_transactions
    where user_id = new.user_id and reason = 'attend_event' and reference_type = 'event' and reference_id = new.event_id
  ) into v_already_awarded;

  if not v_already_awarded then
    perform public.award_xp(new.user_id, 25, 'attend_event', 'event', new.event_id);
    perform public.evaluate_badges(new.user_id);
  end if;

  return new;
end;
$$;

create trigger handle_event_attendee_gamification
  after insert or update on public.event_attendees
  for each row execute function public.handle_event_attendee_gamification();

-- reactions: 2 XP to whoever's content got reacted to (post or check-in),
-- never to yourself. No claw-back on unreact — an append-only ledger
-- doesn't retract past transactions, same as every other XP award here.
create or replace function public.handle_reaction_gamification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content_owner_id uuid;
begin
  if new.post_id is not null then
    select author_id into v_content_owner_id from public.posts where id = new.post_id;
  elsif new.check_in_id is not null then
    select user_id into v_content_owner_id from public.check_ins where id = new.check_in_id;
  end if;

  if v_content_owner_id is not null and v_content_owner_id <> new.user_id then
    perform public.award_xp(v_content_owner_id, 2, 'meaningful_engagement_received', 'reaction', new.id);
    perform public.evaluate_badges(v_content_owner_id);
  end if;

  return new;
end;
$$;

create trigger handle_reaction_gamification
  after insert on public.reactions
  for each row execute function public.handle_reaction_gamification();

-- award_xp/touch_outside_streak/evaluate_badges are internal primitives
-- called by the triggers above, never meant to be called directly by a
-- client. Postgres blocks calling the `returns trigger` functions outside
-- trigger context automatically, but these three are plain functions and
-- would otherwise be exposed as callable RPCs (PostgREST exposes every
-- function in `public` by default) — explicitly revoke that, matching the
-- "XP is never directly client-writable" rule everywhere else.
revoke execute on function public.award_xp(uuid, integer, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.touch_outside_streak(uuid, date) from public, anon, authenticated;
revoke execute on function public.evaluate_badges(uuid) from public, anon, authenticated;
