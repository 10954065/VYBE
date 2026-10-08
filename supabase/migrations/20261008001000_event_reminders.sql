-- event_reminder is the one notification type that isn't reactive to a
-- real action — it's reactive to time passing. Every other notification in
-- this project is an AFTER trigger on a real write; this one is the first
-- thing in the project that needs a clock, so it's the first thing to use
-- pg_cron. No edge function: the job just calls a plain SQL function on a
-- schedule, same "stay inside Postgres" posture as pg_net above.
create extension if not exists pg_cron;

-- Internal primitive: finds everyone 'interested' or 'going' to an event
-- starting within the next hour who hasn't already been reminded about it,
-- and reminds them once. The "already reminded" check has no time bound —
-- an event only starts once, so one reminder per (user, event) is correct
-- forever, not just within this run's window. Not a public RPC.
create or replace function public.send_event_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attendee record;
begin
  for v_attendee in
    select ea.user_id, ea.event_id, e.title
    from public.event_attendees ea
    join public.events e on e.id = ea.event_id
    where ea.status in ('interested', 'going')
      and e.deleted_at is null
      and e.status = 'published'
      and e.start_at between now() and now() + interval '1 hour'
      and not exists (
        select 1 from public.notifications n
        where n.user_id = ea.user_id
          and n.type = 'event_reminder'
          and n.target_id = ea.event_id
      )
  loop
    perform public.create_notification(
      v_attendee.user_id, null, 'event_reminder', 'event', v_attendee.event_id,
      v_attendee.title || ' starts soon'
    );
  end loop;
end;
$$;

revoke execute on function public.send_event_reminders() from public, anon, authenticated;

select cron.schedule('send-event-reminders', '*/10 * * * *', $$select public.send_event_reminders();$$);
