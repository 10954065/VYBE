create table public.vibes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vibe_type text not null check (
    vibe_type in (
      'outside', 'food', 'music', 'party', 'sports', 'chill', 'date',
      'networking', 'gaming', 'study', 'travel', 'shopping', 'fitness'
    )
  ),
  text text,
  place_id uuid references public.places (id),
  crew_id uuid references public.crews (id) on delete cascade,
  -- Precise coordinates are private by default; never read directly by a
  -- public query path. Use extensions.to_approximate_location() (see
  -- packages/shared's map provider) when showing a vibe's rough location.
  lat double precision,
  lng double precision,
  visibility text not null default 'followers'
    check (visibility in ('everyone', 'followers', 'friends', 'crew', 'only_me')),
  expires_at timestamptz not null default (now() + interval '3 hours'),
  created_at timestamptz not null default now(),
  constraint crew_visibility_requires_crew check (visibility <> 'crew' or crew_id is not null)
);

create index vibes_user_id_idx on public.vibes (user_id);
create index vibes_expires_at_idx on public.vibes (expires_at);
create index vibes_place_id_idx on public.vibes (place_id) where place_id is not null;

alter table public.vibes enable row level security;

create policy "vibes_select_visible"
  on public.vibes for select
  using (
    user_id = auth.uid()
    or (
      expires_at > now()
      and public.is_content_visible_to(auth.uid(), user_id, visibility, crew_id)
    )
  );

create policy "vibes_insert_self"
  on public.vibes for insert
  with check (user_id = auth.uid());

create policy "vibes_update_self"
  on public.vibes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "vibes_delete_self"
  on public.vibes for delete
  using (user_id = auth.uid());
