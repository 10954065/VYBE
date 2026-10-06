create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text,
  bio text,
  avatar_url text,
  city_id uuid references public.cities (id),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint username_format check (username ~ '^[a-z0-9_.]{3,30}$')
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));
create index profiles_city_id_idx on public.profiles (city_id);

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_visible"
  on public.profiles for select
  using (deleted_at is null or id = auth.uid());

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create a profile row whenever a new auth.users row is created.
-- SECURITY DEFINER: runs during signup before the session/RLS context for
-- the new user is fully established, so it must bypass RLS to insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_city_id uuid;
  candidate_username text;
begin
  select id into default_city_id from public.cities where slug = 'accra' limit 1;

  candidate_username := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_.]', '', 'g');
  if candidate_username is null or length(candidate_username) < 3 then
    candidate_username := 'vyber';
  end if;
  candidate_username := candidate_username || '_' || substr(new.id::text, 1, 8);

  insert into public.profiles (id, username, display_name, city_id)
  values (
    new.id,
    candidate_username,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    default_city_id
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Interests selected during onboarding; values validated at the app layer
-- against packages/shared's INTERESTS list.
create table public.user_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  interest text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, interest)
);

alter table public.user_interests enable row level security;

create policy "user_interests_select_all"
  on public.user_interests for select
  using (true);

create policy "user_interests_insert_self"
  on public.user_interests for insert
  with check (user_id = auth.uid());

create policy "user_interests_delete_self"
  on public.user_interests for delete
  using (user_id = auth.uid());
