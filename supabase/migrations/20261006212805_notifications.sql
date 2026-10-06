create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete cascade,
  type text not null check (
    type in (
      'like', 'comment', 'follow', 'crew_activity', 'event_reminder',
      'challenge_completed', 'streak_milestone', 'xp_milestone', 'recommendation'
    )
  ),
  target_type text,
  target_id uuid,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_self"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_self"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_delete_self"
  on public.notifications for delete
  using (user_id = auth.uid());

-- No insert policy: notifications are created by server-side logic in
-- response to real events, never directly by a client (prevents spoofing
-- a notification to another user).

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  likes boolean not null default true,
  comments boolean not null default true,
  follows boolean not null default true,
  crew_activity boolean not null default true,
  event_reminders boolean not null default true,
  challenges boolean not null default true,
  streaks boolean not null default true,
  recommendations boolean not null default true,
  push_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_own"
  on public.notification_preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Default preferences row whenever a profile is created.
create or replace function public.handle_new_profile_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_profile_created_preferences
  after insert on public.profiles
  for each row execute function public.handle_new_profile_preferences();
