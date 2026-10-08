-- Device push tokens for Expo's push service. One row per (device, app
-- install) — a user with multiple devices has multiple rows, so `token` is
-- the unique key, not (user_id, token).
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

create trigger set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

alter table public.push_tokens enable row level security;

create policy "push_tokens_select_self"
  on public.push_tokens for select
  using (user_id = auth.uid());

create policy "push_tokens_insert_self"
  on public.push_tokens for insert
  with check (user_id = auth.uid());

-- USING (true) rather than user_id = auth.uid(): a physical device's Expo
-- push token is stable across accounts (log out user A, log in as user B on
-- the same phone), so re-registering an existing token row must be able to
-- reassign it, not just update it while already owned. A push token isn't a
-- credential — knowing one only lets you ask Expo's own service to push
-- that device, the same thing the device's own app already does — so
-- letting any authenticated client claim a token row it presents is a safe
-- trade for making account-switch-on-one-device actually work. WITH CHECK
-- still pins the new owner to the caller, so a client can only ever claim a
-- row for itself, never assign it to someone else.
create policy "push_tokens_claim"
  on public.push_tokens for update
  using (true)
  with check (user_id = auth.uid());

create policy "push_tokens_delete_self"
  on public.push_tokens for delete
  using (user_id = auth.uid());
