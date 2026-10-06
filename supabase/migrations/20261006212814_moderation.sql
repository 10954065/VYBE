create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (
    target_type in ('post', 'user', 'event', 'crew', 'comment', 'place', 'business')
  ),
  target_id uuid not null,
  category text not null check (
    category in ('spam', 'harassment', 'hate', 'sexual_content', 'violence', 'scam', 'fake_account', 'other')
  ),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_target_idx on public.reports (target_type, target_id);
create index reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

-- Reporters can see their own reports' status; review/resolution is
-- service-role (admin) only — not exposed to any authenticated-role policy.
create policy "reports_select_own"
  on public.reports for select
  using (reporter_id = auth.uid());

create policy "reports_insert_self"
  on public.reports for insert
  with check (reporter_id = auth.uid());

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint cannot_block_self check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "blocks_select_own"
  on public.blocks for select
  using (blocker_id = auth.uid());

create policy "blocks_insert_self"
  on public.blocks for insert
  with check (blocker_id = auth.uid());

create policy "blocks_delete_self"
  on public.blocks for delete
  using (blocker_id = auth.uid());
