create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category text not null check (
    category in (
      'restaurants', 'clubs', 'cafes', 'gyms', 'beaches', 'malls', 'parks',
      'event_spaces', 'entertainment', 'sports', 'campus', 'shopping', 'other'
    )
  ),
  address text,
  city_id uuid references public.cities (id),
  lat double precision not null,
  lng double precision not null,
  cover_image_url text,
  business_id uuid references public.businesses (id) on delete set null,
  popularity_score numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint slug_format check (slug ~ '^[a-z0-9-]{3,60}$')
);

create index places_city_id_idx on public.places (city_id);
create index places_category_idx on public.places (category);
create index places_business_id_idx on public.places (business_id) where business_id is not null;

create trigger set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

alter table public.places enable row level security;

-- Places are public discovery data (business locations), unlike user
-- location data elsewhere — exact coordinates are meant to be public here.
create policy "places_select_all"
  on public.places for select
  using (deleted_at is null);

create policy "places_update_business_staff"
  on public.places for update
  using (
    business_id is not null
    and exists (
      select 1 from public.business_staff bs
      where bs.business_id = places.business_id and bs.user_id = auth.uid() and bs.role in ('owner', 'manager')
    )
  )
  with check (true);
