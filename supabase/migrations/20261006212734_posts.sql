create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  city_id uuid references public.cities (id),
  crew_id uuid references public.crews (id),
  kind text not null default 'text' check (kind in ('text', 'image', 'video', 'poll')),
  body text,
  poll_options jsonb,
  visibility text not null default 'everyone'
    check (visibility in ('everyone', 'followers', 'friends', 'crew', 'only_me')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint crew_visibility_requires_crew check (visibility <> 'crew' or crew_id is not null)
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_city_id_created_at_idx on public.posts (city_id, created_at desc);
create index posts_crew_id_idx on public.posts (crew_id) where crew_id is not null;

create trigger set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

create policy "posts_select_visible"
  on public.posts for select
  using (
    deleted_at is null
    and public.is_content_visible_to(auth.uid(), author_id, visibility, crew_id)
  );

create policy "posts_insert_self"
  on public.posts for insert
  with check (author_id = auth.uid());

create policy "posts_update_self"
  on public.posts for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  thumbnail_url text,
  width integer,
  height integer,
  duration_seconds integer,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index post_media_post_id_idx on public.post_media (post_id);

alter table public.post_media enable row level security;

create policy "post_media_select_visible"
  on public.post_media for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_media.post_id and p.deleted_at is null
    )
  );

create policy "post_media_manage_own_post"
  on public.post_media for all
  using (exists (select 1 from public.posts p where p.id = post_media.post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.posts p where p.id = post_media.post_id and p.author_id = auth.uid()));

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index comments_post_id_idx on public.comments (post_id);
create index comments_parent_comment_id_idx on public.comments (parent_comment_id) where parent_comment_id is not null;

create trigger set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

alter table public.comments enable row level security;

create policy "comments_select_visible"
  on public.comments for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id
        and p.deleted_at is null
        and public.is_content_visible_to(auth.uid(), p.author_id, p.visibility, p.crew_id)
    )
  );

create policy "comments_insert_self"
  on public.comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.deleted_at is null
        and public.is_content_visible_to(auth.uid(), p.author_id, p.visibility, p.crew_id)
    )
  );

create policy "comments_update_self"
  on public.comments for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  reaction_type text not null default 'like' check (reaction_type in ('like', 'love', 'fire', 'laugh', 'wow')),
  created_at timestamptz not null default now(),
  constraint exactly_one_target check (
    (post_id is not null and comment_id is null) or (post_id is null and comment_id is not null)
  )
);

create unique index reactions_unique_post_reaction
  on public.reactions (user_id, post_id, reaction_type) where post_id is not null;
create unique index reactions_unique_comment_reaction
  on public.reactions (user_id, comment_id, reaction_type) where comment_id is not null;
create index reactions_post_id_idx on public.reactions (post_id) where post_id is not null;
create index reactions_comment_id_idx on public.reactions (comment_id) where comment_id is not null;

alter table public.reactions enable row level security;

create policy "reactions_select_visible"
  on public.reactions for select
  using (
    (post_id is not null and exists (
      select 1 from public.posts p
      where p.id = reactions.post_id
        and p.deleted_at is null
        and public.is_content_visible_to(auth.uid(), p.author_id, p.visibility, p.crew_id)
    ))
    or
    (comment_id is not null and exists (
      select 1 from public.comments c
      join public.posts p on p.id = c.post_id
      where c.id = reactions.comment_id
        and c.deleted_at is null
        and p.deleted_at is null
        and public.is_content_visible_to(auth.uid(), p.author_id, p.visibility, p.crew_id)
    ))
  );

create policy "reactions_insert_self"
  on public.reactions for insert
  with check (user_id = auth.uid());

create policy "reactions_delete_self"
  on public.reactions for delete
  using (user_id = auth.uid());

create table public.saved_posts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;

create policy "saved_posts_own"
  on public.saved_posts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
