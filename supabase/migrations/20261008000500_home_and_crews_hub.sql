-- Supporting RPCs for the Home screen's "People Are Outside" strip and
-- "Happening Tonight" cards, Discover's "busiest right now" banner, and a
-- new Crews hub screen (My Crews / City Leaderboard) that promotes crews
-- from an Explore segment to their own tab, matching the Stitch nav (every
-- exported screen's bottom nav has a dedicated Crews tab, not a segment).
--
-- Also activates challenges/challenge_participants (schema-complete since
-- Phase 2, never had a UI or progress engine): one real seeded challenge,
-- plus the progress-tracking trigger that makes it a real quest instead of
-- static copy.

-- Who in the viewer's own network (people they follow or are followed by)
-- is "outside now" right now, with where. security invoker: check_ins RLS
-- still applies underneath this, same privacy posture as is_outside_now.
create or replace function public.get_people_outside_now(result_limit int default 10)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  place_name text,
  place_address text,
  is_friend boolean,
  mutual_friend_count bigint,
  last_check_in_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (ci.user_id)
    pr.id, pr.username, pr.display_name, pr.avatar_url,
    pl.name, pl.address,
    sp.is_friend, sp.mutual_friend_count,
    ci.created_at
  from check_ins ci
  join profiles pr on pr.id = ci.user_id
  left join places pl on pl.id = ci.place_id
  cross join lateral public.get_social_proof(auth.uid(), ci.user_id) sp
  where ci.user_id <> auth.uid()
    and ci.visibility <> 'only_me'
    and ci.created_at > now() - interval '4 hours'
    and (
      exists (select 1 from follows f where f.follower_id = auth.uid() and f.following_id = ci.user_id)
      or exists (select 1 from follows f where f.follower_id = ci.user_id and f.following_id = auth.uid())
    )
  order by ci.user_id, ci.created_at desc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.get_people_outside_now is
  'People the viewer follows or is followed by who have checked in within the last 4 hours. security invoker so check_ins RLS still gates what is actually visible.';

-- Events starting within the next 18 hours in a city, with attendee counts
-- flattened via get_event_attendee_summary.
create or replace function public.get_home_highlight_events(p_city_id uuid, result_limit int default 5)
returns table (
  id uuid,
  title text,
  slug text,
  cover_image_url text,
  place_id uuid,
  place_name text,
  start_at timestamptz,
  price_label text,
  interested_count bigint,
  going_count bigint,
  viewer_status text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.id, e.title, e.slug, e.cover_image_url, e.place_id, pl.name,
    e.start_at, e.price_label,
    coalesce(att.interested_count, 0), coalesce(att.going_count, 0), att.viewer_status
  from events e
  left join places pl on pl.id = e.place_id
  left join lateral public.get_event_attendee_summary(e.id) att on true
  where e.city_id = p_city_id
    and e.status = 'published'
    and e.deleted_at is null
    and e.start_at between now() and now() + interval '18 hours'
    and public.is_content_visible_to(auth.uid(), e.organizer_id, e.visibility, e.crew_id)
  order by e.start_at asc
  limit greatest(1, least(result_limit, 20));
$$;

comment on function public.get_home_highlight_events is
  'Published events starting in the next 18 hours in a city ("Happening Tonight"), with real attendee counts. events RLS still applies underneath.';

-- The single place with the most recent check-ins in a city right now
-- ("busiest right now" banner). Real count, no fabricated multiplier —
-- there is no historical baseline to compute a real "3.4x average" from.
create or replace function public.get_busiest_place_now(p_city_id uuid)
returns table (place_id uuid, place_name text, place_address text, check_in_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select pl.id, pl.name, pl.address, count(*)
  from check_ins ci
  join places pl on pl.id = ci.place_id
  where pl.city_id = p_city_id
    and ci.visibility <> 'only_me'
    and ci.created_at > now() - interval '4 hours'
  group by pl.id, pl.name, pl.address
  order by count(*) desc
  limit 1;
$$;

comment on function public.get_busiest_place_now is
  'The place with the most non-only_me check-ins in the last 4 hours, citywide. Aggregate-only, no identities exposed.';

-- City-wide XP leaderboard. Public info, same posture as follows or
-- crews.member_count — a profile's total XP is visible to anyone already
-- (user_xp_totals has public select), this just orders and ranks it.
create or replace function public.get_city_leaderboard(p_city_id uuid, result_limit int default 20)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  total_xp bigint,
  outside_streak_current integer,
  rank bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    pr.id, pr.username, pr.display_name, pr.avatar_url,
    coalesce(x.total_xp, 0),
    coalesce(s.current_count, 0),
    row_number() over (order by coalesce(x.total_xp, 0) desc)
  from profiles pr
  left join user_xp_totals x on x.user_id = pr.id
  left join streaks s on s.user_id = pr.id and s.streak_type = 'outside'
  where pr.city_id = p_city_id and pr.deleted_at is null
  order by coalesce(x.total_xp, 0) desc
  limit greatest(1, least(result_limit, 50));
$$;

comment on function public.get_city_leaderboard is
  'Profiles in a city ranked by total XP (user_xp_totals). Public data, same posture as follows or crews.member_count.';

-- How many of a crew's approved members are both friends-of-viewer and
-- outside now ("3 friends inside"). security invoker: is_outside_now
-- already respects check_ins RLS per-member.
create or replace function public.get_crew_friends_inside_count(p_crew_id uuid)
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)
  from crew_members cm
  where cm.crew_id = p_crew_id
    and cm.status = 'approved'
    and cm.user_id <> auth.uid()
    and public.are_friends(auth.uid(), cm.user_id)
    and public.is_outside_now(cm.user_id);
$$;

comment on function public.get_crew_friends_inside_count is
  'How many approved members of this crew are friends of the viewer and outside now.';

-- The viewer's own approved crews, with real presence counts flattened in
-- (avoids N+1 calls from the Crews hub screen).
create or replace function public.get_my_crews(result_limit int default 20)
returns table (
  id uuid,
  name text,
  slug text,
  avatar_url text,
  cover_image_url text,
  category text,
  member_count integer,
  outside_now_count bigint,
  friends_inside_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id, c.name, c.slug, c.avatar_url, c.cover_image_url, c.category,
    c.member_count,
    public.get_crew_outside_count(c.id),
    public.get_crew_friends_inside_count(c.id)
  from crews c
  join crew_members cm on cm.crew_id = c.id and cm.user_id = auth.uid() and cm.status = 'approved'
  where c.deleted_at is null
  order by c.name
  limit greatest(1, least(result_limit, 50));
$$;

comment on function public.get_my_crews is
  'The viewer''s own approved crews, with real member/outside-now/friends-inside counts flattened in.';

-- Activate challenges: join a challenge awards join_challenge XP (5, per
-- XP_AWARDS), matching every other write-path in this project ("no direct
-- client mutation of XP"). challenge_participants_insert_self already
-- restricts this to active challenges.
create or replace function public.handle_challenge_participant_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_xp(new.user_id, 5, 'join_challenge', 'challenge', new.challenge_id);
  return new;
end;
$$;

create trigger handle_challenge_participant_join
  after insert on public.challenge_participants
  for each row execute function public.handle_challenge_participant_join();

-- Real progress tracking for all three challenge `type`s that currently
-- have seed rows (supabase/seed.sql). Each follows the same shape: find the
-- participant's active, not-yet-completed challenges of that type whose
-- window covers `new`'s timestamp, recompute progress from real rows,
-- complete + pay out challenges.xp_reward (not the flat complete_challenge
-- constant — each challenge sets its own reward) once the target is met.
--
-- requirements/progress jsonb key convention (this engine is the only
-- reader/writer of these columns, so it defines the convention):
--   visit_places -> {"distinct_places": N}
--   attend_event -> {"count": N}            (distinct events gone/checked-in to)
--   join_crew    -> {"count": N}            (distinct crews approved-joined)
create or replace function public.update_challenge_progress_on_check_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant record;
  v_target integer;
  v_distinct_new_places integer;
begin
  if new.place_id is null then
    return new;
  end if;

  for v_participant in
    select cp.challenge_id, cp.user_id, c.requirements, c.xp_reward, c.start_at, c.end_at
    from public.challenge_participants cp
    join public.challenges c on c.id = cp.challenge_id
    where cp.user_id = new.user_id
      and cp.completed_at is null
      and c.type = 'visit_places'
      and c.status = 'active'
      and new.created_at between c.start_at and c.end_at
  loop
    v_target := coalesce((v_participant.requirements ->> 'distinct_places')::integer, 0);

    select count(distinct place_id) into v_distinct_new_places
    from public.check_ins
    where user_id = new.user_id
      and place_id is not null
      and created_at between v_participant.start_at and v_participant.end_at;

    update public.challenge_participants
    set progress = jsonb_build_object('distinct_places', v_distinct_new_places)
    where challenge_id = v_participant.challenge_id and user_id = new.user_id;

    if v_target > 0 and v_distinct_new_places >= v_target then
      update public.challenge_participants
      set completed_at = now()
      where challenge_id = v_participant.challenge_id and user_id = new.user_id and completed_at is null;

      perform public.award_xp(new.user_id, v_participant.xp_reward, 'complete_challenge', 'challenge', v_participant.challenge_id);
    end if;
  end loop;

  return new;
end;
$$;

create trigger update_challenge_progress_on_check_in
  after insert on public.check_ins
  for each row execute function public.update_challenge_progress_on_check_in();

create or replace function public.update_challenge_progress_on_event_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant record;
  v_target integer;
  v_distinct_events integer;
begin
  if new.status not in ('going', 'checked_in') then
    return new;
  end if;

  for v_participant in
    select cp.challenge_id, cp.user_id, c.requirements, c.xp_reward, c.start_at, c.end_at
    from public.challenge_participants cp
    join public.challenges c on c.id = cp.challenge_id
    where cp.user_id = new.user_id
      and cp.completed_at is null
      and c.type = 'attend_event'
      and c.status = 'active'
      and now() between c.start_at and c.end_at
  loop
    v_target := coalesce((v_participant.requirements ->> 'count')::integer, 0);

    select count(distinct event_id) into v_distinct_events
    from public.event_attendees
    where user_id = new.user_id
      and status in ('going', 'checked_in')
      and updated_at between v_participant.start_at and v_participant.end_at;

    update public.challenge_participants
    set progress = jsonb_build_object('count', v_distinct_events)
    where challenge_id = v_participant.challenge_id and user_id = new.user_id;

    if v_target > 0 and v_distinct_events >= v_target then
      update public.challenge_participants
      set completed_at = now()
      where challenge_id = v_participant.challenge_id and user_id = new.user_id and completed_at is null;

      perform public.award_xp(new.user_id, v_participant.xp_reward, 'complete_challenge', 'challenge', v_participant.challenge_id);
    end if;
  end loop;

  return new;
end;
$$;

create trigger update_challenge_progress_on_event_attendance
  after insert or update on public.event_attendees
  for each row execute function public.update_challenge_progress_on_event_attendance();

create or replace function public.update_challenge_progress_on_crew_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant record;
  v_target integer;
  v_distinct_crews integer;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  for v_participant in
    select cp.challenge_id, cp.user_id, c.requirements, c.xp_reward, c.start_at, c.end_at
    from public.challenge_participants cp
    join public.challenges c on c.id = cp.challenge_id
    where cp.user_id = new.user_id
      and cp.completed_at is null
      and c.type = 'join_crew'
      and c.status = 'active'
      and now() between c.start_at and c.end_at
  loop
    v_target := coalesce((v_participant.requirements ->> 'count')::integer, 0);

    select count(distinct crew_id) into v_distinct_crews
    from public.crew_members
    where user_id = new.user_id
      and status = 'approved'
      and joined_at between v_participant.start_at and v_participant.end_at;

    update public.challenge_participants
    set progress = jsonb_build_object('count', v_distinct_crews)
    where challenge_id = v_participant.challenge_id and user_id = new.user_id;

    if v_target > 0 and v_distinct_crews >= v_target then
      update public.challenge_participants
      set completed_at = now()
      where challenge_id = v_participant.challenge_id and user_id = new.user_id and completed_at is null;

      perform public.award_xp(new.user_id, v_participant.xp_reward, 'complete_challenge', 'challenge', v_participant.challenge_id);
    end if;
  end loop;

  return new;
end;
$$;

create trigger update_challenge_progress_on_crew_join
  after insert or update on public.crew_members
  for each row execute function public.update_challenge_progress_on_crew_join();
