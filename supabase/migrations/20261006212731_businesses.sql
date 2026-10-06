create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  category text,
  city_id uuid references public.cities (id),
  logo_url text,
  cover_image_url text,
  website_url text,
  follower_count integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint slug_format check (slug ~ '^[a-z0-9-]{3,40}$')
);

create index businesses_city_id_idx on public.businesses (city_id);

create trigger set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create table public.business_staff (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- A table's RLS policy querying itself (even via a differently-aliased
-- subquery) recurses in Postgres ("infinite recursion detected in
-- policy") — this helper bypasses RLS internally to avoid that, the same
-- pattern used for crew_members' self-reference.
create or replace function public.is_business_staff(viewer uuid, target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_staff
    where business_id = target_business_id and user_id = viewer
  );
$$;

-- RLS policies live after both tables exist: a policy's USING/WITH CHECK
-- expression is bound to the catalog immediately (unlike a function body),
-- so it cannot forward-reference a table created later in this file.
alter table public.businesses enable row level security;

create policy "businesses_select_visible"
  on public.businesses for select
  using (deleted_at is null);

create policy "businesses_insert_self"
  on public.businesses for insert
  with check (owner_id = auth.uid());

create policy "businesses_update_staff"
  on public.businesses for update
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.business_staff bs
      where bs.business_id = businesses.id and bs.user_id = auth.uid() and bs.role in ('owner', 'manager')
    )
  )
  with check (true);

alter table public.business_staff enable row level security;

create policy "business_staff_select_staff_or_owner"
  on public.business_staff for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.businesses b where b.id = business_staff.business_id and b.owner_id = auth.uid())
    or public.is_business_staff(auth.uid(), business_id)
  );

create policy "business_staff_manage_owner"
  on public.business_staff for all
  using (exists (select 1 from public.businesses b where b.id = business_staff.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = business_staff.business_id and b.owner_id = auth.uid()));
