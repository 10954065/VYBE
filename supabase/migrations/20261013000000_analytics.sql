-- Phase 13: product analytics.
--
-- analytics_events has existed since Phase 2 (client insert-only, no reads)
-- with no writer. The mobile app now batches events into it. Because any
-- client — including an anonymous one — can insert, the table only accepts
-- well-formed, bounded rows; anything else is rejected by Postgres rather
-- than trusted from the client's own validation.

alter table public.analytics_events
  add constraint analytics_events_event_name_format
    check (event_name ~ '^[a-z][a-z0-9_]{2,63}$'),
  add constraint analytics_events_properties_object
    check (jsonb_typeof(properties) = 'object'),
  add constraint analytics_events_properties_size
    check (pg_column_size(properties) <= 4096);

-- Inserted rows must be "now": a client can't backfill or future-date events
-- to distort daily metrics. Server clock wins; the column default already
-- sets it, this just stops a client from overriding it.
create or replace function public.analytics_events_stamp_created_at()
returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  return new;
end;
$$;

create trigger analytics_events_stamp_created_at
  before insert on public.analytics_events
  for each row execute function public.analytics_events_stamp_created_at();

create index analytics_events_created_at_idx on public.analytics_events (created_at desc);

-- One aggregate for the admin dashboard. Product numbers (signups, posts,
-- check-ins, …) are counted from the real tables, not from client-reported
-- events, so they can't be skewed by a client that drops or forges events;
-- analytics_events is only used for what only the client can know (who was
-- active, sessions, which screens they used).
--
-- SECURITY INVOKER and executable only by service_role: the admin dashboard
-- calls it with the service-role client after its own allowlist check.
create or replace function public.get_analytics_overview(p_days integer)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 7), 1), 365);
  v_since timestamptz := date_trunc('day', now()) - make_interval(days => v_days - 1);
  v_result jsonb;
begin
  with
  days as (
    select generate_series(v_since, date_trunc('day', now()), interval '1 day') as day
  ),
  recent_events as (
    select user_id, event_name, properties, created_at
    from analytics_events
    where created_at >= v_since
  ),
  cohort as (
    select p.id, p.created_at, p.onboarding_completed_at
    from profiles p
    where p.created_at >= v_since and p.deleted_at is null
  ),
  cohort_flags as (
    select
      c.id,
      c.onboarding_completed_at is not null as onboarded,
      (
        exists (select 1 from posts where author_id = c.id)
        or exists (select 1 from check_ins where user_id = c.id)
        or exists (select 1 from vibes where user_id = c.id)
        or exists (select 1 from comments where author_id = c.id)
      ) as acted,
      exists (
        select 1 from analytics_events e
        where e.user_id = c.id and e.created_at >= date_trunc('day', c.created_at) + interval '1 day'
      ) as returned
    from cohort c
  )
  select jsonb_build_object(
    'range_days', v_days,
    'totals', jsonb_build_object(
      'signups', (select count(*) from cohort),
      'onboarded', (select count(*) from cohort where onboarding_completed_at is not null),
      'active_users', (select count(distinct user_id) from recent_events where user_id is not null),
      'sessions', (select count(distinct properties ->> 'session_id') from recent_events where properties ? 'session_id'),
      'posts', (select count(*) from posts where created_at >= v_since),
      'check_ins', (select count(*) from check_ins where created_at >= v_since),
      'events_created', (select count(*) from events where created_at >= v_since),
      'crews_created', (select count(*) from crews where created_at >= v_since),
      'reactions', (select count(*) from reactions where created_at >= v_since),
      'comments', (select count(*) from comments where created_at >= v_since)
    ),
    -- Each source is grouped by day once, then joined onto the day series —
    -- not re-scanned per day per metric.
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'active_users', coalesce(a.n, 0),
        'signups', coalesce(s.n, 0),
        'posts', coalesce(p.n, 0),
        'check_ins', coalesce(ci.n, 0)
      ) order by d.day), '[]'::jsonb)
      from days d
      left join (
        select date_trunc('day', created_at) as day, count(distinct user_id) as n
        from recent_events where user_id is not null group by 1
      ) a on a.day = d.day
      left join (
        select date_trunc('day', created_at) as day, count(*) as n from cohort group by 1
      ) s on s.day = d.day
      left join (
        select date_trunc('day', created_at) as day, count(*) as n
        from posts where created_at >= v_since group by 1
      ) p on p.day = d.day
      left join (
        select date_trunc('day', created_at) as day, count(*) as n
        from check_ins where created_at >= v_since group by 1
      ) ci on ci.day = d.day
    ),
    'funnel', jsonb_build_object(
      'signed_up', (select count(*) from cohort_flags),
      'onboarded', (select count(*) from cohort_flags where onboarded),
      'first_action', (select count(*) from cohort_flags where onboarded and acted),
      'returned', (select count(*) from cohort_flags where onboarded and acted and returned)
    ),
    'top_screens', (
      select coalesce(jsonb_agg(row_to_json(s)::jsonb order by s.views desc), '[]'::jsonb)
      from (
        select properties ->> 'screen' as screen, count(*)::int as views, count(distinct user_id)::int as users
        from recent_events
        where event_name = 'screen_viewed' and properties ? 'screen'
        group by 1
        order by views desc
        limit 10
      ) s
    ),
    'top_events', (
      select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.count desc), '[]'::jsonb)
      from (
        select event_name, count(*)::int as count, count(distinct user_id)::int as users
        from recent_events
        where event_name <> 'screen_viewed'
        group by 1
        order by count desc
        limit 15
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_analytics_overview(integer) from public, anon, authenticated;
grant execute on function public.get_analytics_overview(integer) to service_role;
