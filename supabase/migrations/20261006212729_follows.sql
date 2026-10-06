create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint cannot_follow_self check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

-- The social graph is public (follower/following lists and counts are
-- shown on profiles), matching common social-network conventions.
create policy "follows_select_all"
  on public.follows for select
  using (true);

create policy "follows_insert_self"
  on public.follows for insert
  with check (follower_id = auth.uid());

create policy "follows_delete_self"
  on public.follows for delete
  using (follower_id = auth.uid());
