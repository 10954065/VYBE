-- Attendee counts by status for one event, plus the caller's own status.
-- security invoker (the default, stated explicitly) so event_attendees'
-- own RLS still applies: an event the caller isn't allowed to see returns
-- zero counts rather than an error, it never leaks counts past what RLS
-- already allows a plain `select count(*)` to see.
create or replace function public.get_event_attendee_summary(target_event_id uuid)
returns table (
  interested_count bigint,
  going_count bigint,
  checked_in_count bigint,
  viewer_status text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*) filter (where status = 'interested'),
    count(*) filter (where status = 'going'),
    count(*) filter (where status = 'checked_in'),
    (select status from event_attendees where event_id = target_event_id and user_id = auth.uid())
  from event_attendees
  where event_id = target_event_id;
$$;

comment on function public.get_event_attendee_summary is
  'Attendee counts by status for one event, plus the caller''s own status. security invoker so event_attendees RLS still applies underneath it.';
