create table public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  avatar_url text,
  cover_image_url text,
  category text,
  city_id uuid references public.cities (id),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  privacy text not null default 'public' check (privacy in ('public', 'private')),
  member_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint slug_format check (slug ~ '^[a-z0-9-]{3,40}$')
);

create index crews_city_id_idx on public.crews (city_id);

create trigger set_updated_at
  before update on public.crews
  for each row execute function public.set_updated_at();

create table public.crew_members (
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin', 'owner')),
  status text not null default 'approved' check (status in ('pending', 'approved')),
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);

create index crew_members_user_id_idx on public.crew_members (user_id);

-- Private crews require approval; public crews auto-approve. The client's
-- requested status is always overridden server-side so membership gating
-- cannot be bypassed by an insert that just claims status = 'approved'.
create or replace function public.set_crew_member_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  crew_privacy text;
begin
  select privacy into crew_privacy from public.crews where id = new.crew_id;
  if crew_privacy = 'private' and new.role = 'member' then
    new.status := 'pending';
  else
    new.status := 'approved';
  end if;
  return new;
end;
$$;

create trigger set_crew_member_status
  before insert on public.crew_members
  for each row execute function public.set_crew_member_status();

create or replace function public.sync_crew_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'approved' then
    update public.crews set member_count = member_count + 1 where id = new.crew_id;
  elsif tg_op = 'DELETE' and old.status = 'approved' then
    update public.crews set member_count = member_count - 1 where id = old.crew_id;
  elsif tg_op = 'UPDATE' and old.status <> new.status then
    if new.status = 'approved' then
      update public.crews set member_count = member_count + 1 where id = new.crew_id;
    elsif old.status = 'approved' then
      update public.crews set member_count = member_count - 1 where id = old.crew_id;
    end if;
  end if;
  return null;
end;
$$;

create trigger sync_crew_member_count
  after insert or update or delete on public.crew_members
  for each row execute function public.sync_crew_member_count();

-- A crew's creator is automatically its first owner-member. Without this,
-- the creator would fail their own crew's membership-gated RLS checks.
create or replace function public.add_crew_creator_as_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.crew_members (crew_id, user_id, role)
  values (new.id, new.creator_id, 'owner');
  return new;
end;
$$;

create trigger add_crew_creator_as_owner
  after insert on public.crews
  for each row execute function public.add_crew_creator_as_owner();

-- crews and crew_members RLS policies must not query each other directly:
-- Any RLS policy that queries an RLS-enabled table from inside its own
-- USING/WITH CHECK clause recurses in Postgres ("infinite recursion
-- detected in policy") — including a table querying *itself* (a plain
-- self-join subquery is not special-cased away). These SECURITY DEFINER
-- helpers break every such cycle below by bypassing RLS internally, the
-- same way is_content_visible_to() does for other tables.
create or replace function public.get_crew_privacy(target_crew_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select privacy from public.crews where id = target_crew_id;
$$;

create or replace function public.is_crew_member(viewer uuid, target_crew_id uuid, require_approved boolean default false)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.crew_members
    where crew_id = target_crew_id
      and user_id = viewer
      and (not require_approved or status = 'approved')
  );
$$;

create or replace function public.is_crew_admin(viewer uuid, target_crew_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.crew_members
    where crew_id = target_crew_id
      and user_id = viewer
      and role in ('admin', 'owner')
      and status = 'approved'
  );
$$;

-- RLS policies live after both tables (and the triggers that populate
-- them) exist: a policy's USING/WITH CHECK expression is bound to the
-- catalog immediately, unlike a function body, so it cannot
-- forward-reference a table created later in this file.
alter table public.crews enable row level security;

-- A private crew is discoverable (so there's something to request to
-- join), just like a private Discord server or Facebook Group — it's the
-- member list and crew-scoped posts that stay gated behind approved
-- membership (crew_members' own policies, and is_content_visible_to()).
create policy "crews_select_visible"
  on public.crews for select
  using (deleted_at is null);

create policy "crews_insert_self"
  on public.crews for insert
  with check (creator_id = auth.uid());

create policy "crews_update_admins"
  on public.crews for update
  using (creator_id = auth.uid() or public.is_crew_admin(auth.uid(), id))
  with check (true);

alter table public.crew_members enable row level security;

create policy "crew_members_select_visible"
  on public.crew_members for select
  using (
    user_id = auth.uid()
    or public.get_crew_privacy(crew_id) = 'public'
    or public.is_crew_member(auth.uid(), crew_id, true)
  );

create policy "crew_members_insert_self"
  on public.crew_members for insert
  with check (user_id = auth.uid());

create policy "crew_members_update_admins"
  on public.crew_members for update
  using (public.is_crew_admin(auth.uid(), crew_id))
  with check (true);

create policy "crew_members_delete_self_or_admin"
  on public.crew_members for delete
  using (user_id = auth.uid() or public.is_crew_admin(auth.uid(), crew_id));
