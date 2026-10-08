-- Supporting RPCs for the Profile screen's real quick-stats bar and
-- real check-in timeline (with real reaction counts, now that reactions
-- can target check_ins too — see 20261008000000_check_in_reactions.sql).

create or replace function public.get_my_profile_stats()
returns table (
  distinct_events bigint,
  distinct_places bigint,
  longest_outside_streak integer,
  crew_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (select count(distinct event_id) from check_ins where user_id = auth.uid() and event_id is not null),
    (select count(distinct place_id) from check_ins where user_id = auth.uid() and place_id is not null),
    coalesce((select longest_count from streaks where user_id = auth.uid() and streak_type = 'outside'), 0),
    (select count(*) from crew_members where user_id = auth.uid() and status = 'approved');
$$;

comment on function public.get_my_profile_stats is
  'Real quick-stats for the viewer''s own profile screen: distinct places/events checked into, longest outside streak, approved crew count.';

create or replace function public.get_my_check_ins(result_limit int default 20)
returns table (
  id uuid,
  place_id uuid,
  place_name text,
  event_id uuid,
  event_title text,
  note text,
  visibility text,
  created_at timestamptz,
  reaction_count bigint,
  viewer_has_reacted boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    ci.id, ci.place_id, pl.name, ci.event_id, ev.title, ci.note, ci.visibility, ci.created_at,
    coalesce(rc.count, 0),
    exists (select 1 from reactions r where r.check_in_id = ci.id and r.user_id = auth.uid())
  from check_ins ci
  left join places pl on pl.id = ci.place_id
  left join events ev on ev.id = ci.event_id
  left join lateral (select count(*) as count from reactions r where r.check_in_id = ci.id) rc on true
  where ci.user_id = auth.uid()
  order by ci.created_at desc
  limit greatest(1, least(result_limit, 50));
$$;

comment on function public.get_my_check_ins is
  'The viewer''s own check-in timeline with real reaction counts flattened in, newest first.';
