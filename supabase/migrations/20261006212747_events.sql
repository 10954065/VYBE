create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  category text,
  place_id uuid references public.places (id),
  city_id uuid references public.cities (id),
  organizer_id uuid not null references public.profiles (id),
  business_id uuid references public.businesses (id),
  crew_id uuid references public.crews (id),
  start_at timestamptz not null,
  end_at timestamptz,
  capacity integer,
  visibility text not null default 'everyone'
    check (visibility in ('everyone', 'followers', 'friends', 'crew', 'only_me')),
  status text not null default 'published' check (status in ('draft', 'published', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint slug_format check (slug ~ '^[a-z0-9-]{3,60}$'),
  constraint crew_visibility_requires_crew check (visibility <> 'crew' or crew_id is not null),
  constraint end_after_start check (end_at is null or end_at > start_at)
);

create index events_city_id_start_at_idx on public.events (city_id, start_at);
create index events_place_id_idx on public.events (place_id) where place_id is not null;
create index events_organizer_id_idx on public.events (organizer_id);

create trigger set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "events_select_visible"
  on public.events for select
  using (
    deleted_at is null
    and public.is_content_visible_to(auth.uid(), organizer_id, visibility, crew_id)
  );

create policy "events_insert_self"
  on public.events for insert
  with check (organizer_id = auth.uid());

create policy "events_update_organizer"
  on public.events for update
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

create table public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'interested' check (status in ('interested', 'going', 'checked_in', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_attendees_user_id_idx on public.event_attendees (user_id);

create trigger set_updated_at
  before update on public.event_attendees
  for each row execute function public.set_updated_at();

alter table public.event_attendees enable row level security;

create policy "event_attendees_select_visible"
  on public.event_attendees for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.events e
      where e.id = event_attendees.event_id
        and e.deleted_at is null
        and public.is_content_visible_to(auth.uid(), e.organizer_id, e.visibility, e.crew_id)
    )
  );

create policy "event_attendees_insert_self"
  on public.event_attendees for insert
  with check (user_id = auth.uid());

-- Only 'interested' | 'going' | 'cancelled' are client-settable. 'checked_in'
-- is set exclusively by check_ins' sync trigger (see check_ins migration).
create policy "event_attendees_update_self_status"
  on public.event_attendees for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status in ('interested', 'going', 'cancelled'));
