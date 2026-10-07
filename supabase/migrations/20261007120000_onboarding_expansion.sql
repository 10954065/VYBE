-- Expands onboarding from a single username/interests screen into the real
-- 3-step preference flow: nightlife genres, home-base neighborhoods +
-- travel radius, and pace/crew/privacy preferences. See docs/onboarding.md.

alter table public.profiles
  add column travel_radius text check (travel_radius in ('hood', 'central', 'anywhere')),
  add column nightlife_pace text check (nightlife_pace in ('night_owl', 'sundowner', 'explorer')),
  add column crew_preference text check (crew_preference in ('squad', 'solo')),
  add column default_check_in_visibility text not null default 'followers'
    check (default_check_in_visibility in ('followers', 'only_me'));

-- Mirrors user_interests (profiles.sql): free text validated at the app
-- layer against packages/shared's GENRES list, not a DB-level enum.
create table public.user_genres (
  user_id uuid not null references public.profiles (id) on delete cascade,
  genre text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, genre)
);

alter table public.user_genres enable row level security;

create policy "user_genres_select_all"
  on public.user_genres for select
  using (true);

create policy "user_genres_insert_self"
  on public.user_genres for insert
  with check (user_id = auth.uid());

create policy "user_genres_delete_self"
  on public.user_genres for delete
  using (user_id = auth.uid());

-- Mirrors user_interests; validated against packages/shared's NEIGHBORHOODS.
create table public.user_neighborhoods (
  user_id uuid not null references public.profiles (id) on delete cascade,
  neighborhood text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, neighborhood)
);

alter table public.user_neighborhoods enable row level security;

create policy "user_neighborhoods_select_all"
  on public.user_neighborhoods for select
  using (true);

create policy "user_neighborhoods_insert_self"
  on public.user_neighborhoods for insert
  with check (user_id = auth.uid());

create policy "user_neighborhoods_delete_self"
  on public.user_neighborhoods for delete
  using (user_id = auth.uid());

-- New XP reason for the onboarding completion award below. Keep in sync
-- with packages/shared's XP_AWARDS (gamification.ts).
alter table public.xp_transactions drop constraint xp_transactions_reason_check;
alter table public.xp_transactions add constraint xp_transactions_reason_check
  check (
    reason in (
      'check_in', 'attend_event', 'create_post', 'join_challenge', 'complete_challenge',
      'join_crew', 'explore_new_place', 'meaningful_engagement_received', 'complete_onboarding'
    )
  );

-- Completes onboarding atomically: profile fields, the three preference
-- join-tables, and a one-time XP award, all in one server-side transaction.
-- SECURITY DEFINER because xp_transactions has no client insert policy at
-- all (by design — XP must never be directly client-writable); this is the
-- one controlled path that writes it, gated by auth.uid() and an
-- already-onboarded check so it can't be replayed for repeat XP.
create or replace function public.complete_onboarding(
  p_username text,
  p_display_name text,
  p_city_id uuid,
  p_avatar_url text,
  p_interests text[],
  p_genres text[],
  p_neighborhoods text[],
  p_travel_radius text,
  p_nightlife_pace text,
  p_crew_preference text,
  p_default_check_in_visibility text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_already_onboarded boolean;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select onboarding_completed_at is not null into v_already_onboarded
  from public.profiles
  where id = v_user_id;

  if v_already_onboarded then
    raise exception 'onboarding_already_completed';
  end if;

  update public.profiles
  set
    username = p_username,
    display_name = p_display_name,
    city_id = p_city_id,
    avatar_url = coalesce(p_avatar_url, avatar_url),
    travel_radius = p_travel_radius,
    nightlife_pace = p_nightlife_pace,
    crew_preference = p_crew_preference,
    default_check_in_visibility = p_default_check_in_visibility,
    onboarding_completed_at = now()
  where id = v_user_id;

  delete from public.user_interests where user_id = v_user_id;
  insert into public.user_interests (user_id, interest)
    select v_user_id, unnest(p_interests);

  delete from public.user_genres where user_id = v_user_id;
  insert into public.user_genres (user_id, genre)
    select v_user_id, unnest(p_genres);

  delete from public.user_neighborhoods where user_id = v_user_id;
  insert into public.user_neighborhoods (user_id, neighborhood)
    select v_user_id, unnest(p_neighborhoods);

  insert into public.xp_transactions (user_id, amount, reason)
  values (v_user_id, 100, 'complete_onboarding');
end;
$$;
