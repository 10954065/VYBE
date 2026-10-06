-- High-volume, append-only, write-mostly — bigint identity instead of uuid
-- keeps indexes smaller; this table is never joined against as a FK target.
create table public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  city_id uuid references public.cities (id),
  created_at timestamptz not null default now()
);

create index analytics_events_event_name_created_at_idx on public.analytics_events (event_name, created_at desc);
create index analytics_events_user_id_idx on public.analytics_events (user_id) where user_id is not null;

alter table public.analytics_events enable row level security;

-- Write-only from the client's perspective: anyone (including anonymous,
-- pre-auth events) can insert, but only ever tagged with their own user_id
-- or none. Reads are service-role only (admin dashboards), not exposed here.
create policy "analytics_events_insert_any"
  on public.analytics_events for insert
  with check (user_id is null or user_id = auth.uid());
