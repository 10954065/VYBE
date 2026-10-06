-- Append-only XP ledger. `reason` values must stay in sync with
-- packages/shared's XP_AWARDS keys.
create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null check (
    reason in (
      'check_in', 'attend_event', 'create_post', 'join_challenge', 'complete_challenge',
      'join_crew', 'explore_new_place', 'meaningful_engagement_received'
    )
  ),
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index xp_transactions_user_id_idx on public.xp_transactions (user_id);

alter table public.xp_transactions enable row level security;

create policy "xp_transactions_select_all"
  on public.xp_transactions for select
  using (true);

-- No insert/update/delete policy for anon/authenticated: XP is only ever
-- written by server-side service-role code in response to a verified
-- action, so it is always an auditable transaction and never directly
-- client-writable (prevents self-awarding).

-- Derived, not stored — current XP is always the sum of its transactions.
create view public.user_xp_totals as
  select user_id, coalesce(sum(amount), 0)::bigint as total_xp
  from public.xp_transactions
  group by user_id;

create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  streak_type text not null check (streak_type in ('outside', 'social', 'explorer', 'event')),
  current_count integer not null default 0,
  longest_count integer not null default 0,
  last_activity_date date,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, streak_type)
);

create trigger set_updated_at
  before update on public.streaks
  for each row execute function public.set_updated_at();

alter table public.streaks enable row level security;

create policy "streaks_select_all"
  on public.streaks for select
  using (true);

-- No insert/update policy: streak counts are computed server-side (date
-- math, timezone handling) and never trusted from the client.

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon_url text,
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.badges enable row level security;

create policy "badges_select_all"
  on public.badges for select
  using (true);

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "user_badges_select_all"
  on public.user_badges for select
  using (true);

-- No insert policy: badges are awarded by server-side logic only.

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (
    type in ('visit_places', 'attend_event', 'check_in', 'post_vibe', 'join_crew', 'custom')
  ),
  requirements jsonb not null default '{}'::jsonb,
  xp_reward integer not null default 0,
  city_id uuid references public.cities (id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'active' check (status in ('draft', 'active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint end_after_start check (end_at > start_at)
);

create index challenges_city_id_status_idx on public.challenges (city_id, status);

create trigger set_updated_at
  before update on public.challenges
  for each row execute function public.set_updated_at();

alter table public.challenges enable row level security;

create policy "challenges_select_published"
  on public.challenges for select
  using (status <> 'draft');

-- No insert/update policy: challenges are curated server-side (admin) for
-- MVP, not user-generated.

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

alter table public.challenge_participants enable row level security;

create policy "challenge_participants_select_all"
  on public.challenge_participants for select
  using (true);

create policy "challenge_participants_insert_self"
  on public.challenge_participants for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.challenges c where c.id = challenge_id and c.status = 'active')
  );

-- No update policy: progress and completion are computed server-side from
-- real actions (check-ins, event attendance, etc.), never client-reported
-- — this is what keeps "complete a challenge" from being free XP.
