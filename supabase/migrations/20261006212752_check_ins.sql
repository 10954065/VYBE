create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid references public.places (id),
  event_id uuid references public.events (id),
  crew_id uuid references public.crews (id),
  lat double precision,
  lng double precision,
  note text,
  visibility text not null default 'followers'
    check (visibility in ('everyone', 'followers', 'friends', 'crew', 'only_me')),
  created_at timestamptz not null default now(),
  constraint has_a_target check (place_id is not null or event_id is not null),
  constraint crew_visibility_requires_crew check (visibility <> 'crew' or crew_id is not null)
);

create index check_ins_user_id_created_at_idx on public.check_ins (user_id, created_at desc);
create index check_ins_place_id_idx on public.check_ins (place_id) where place_id is not null;
create index check_ins_event_id_idx on public.check_ins (event_id) where event_id is not null;

-- Abuse prevention: reject a check-in within CHECK_IN_RATE_LIMIT_SECONDS of
-- the user's previous one. Mirrors packages/shared's gamification constant
-- — if that value changes, update it here too.
create or replace function public.enforce_check_in_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  last_check_in_at timestamptz;
begin
  select created_at into last_check_in_at
  from public.check_ins
  where user_id = new.user_id
  order by created_at desc
  limit 1;

  if last_check_in_at is not null and new.created_at - last_check_in_at < interval '120 seconds' then
    raise exception 'check_in_rate_limited' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger enforce_check_in_rate_limit
  before insert on public.check_ins
  for each row execute function public.enforce_check_in_rate_limit();

-- A check-in against an event marks that attendee as checked in. This is
-- the only path that can set event_attendees.status = 'checked_in' — see
-- the events migration's update policy.
create or replace function public.sync_event_checkin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_id is not null then
    insert into public.event_attendees (event_id, user_id, status)
    values (new.event_id, new.user_id, 'checked_in')
    on conflict (event_id, user_id) do update set status = 'checked_in';
  end if;
  return new;
end;
$$;

create trigger sync_event_checkin
  after insert on public.check_ins
  for each row execute function public.sync_event_checkin();

alter table public.check_ins enable row level security;

-- Immutable after creation by design — real check-ins should not be
-- editable after the fact. No update/delete policy for regular users.
create policy "check_ins_select_visible"
  on public.check_ins for select
  using (
    user_id = auth.uid()
    or public.is_content_visible_to(auth.uid(), user_id, visibility, crew_id)
  );

create policy "check_ins_insert_self"
  on public.check_ins for insert
  with check (user_id = auth.uid());
