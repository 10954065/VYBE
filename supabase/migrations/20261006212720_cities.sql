create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null,
  timezone text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  is_launched boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

alter table public.cities enable row level security;

-- Cities are reference data: readable by anyone, writable only by the
-- service role (never exposed as a client-writable table).
create policy "cities_select_all"
  on public.cities for select
  using (true);
