-- Phase 15: photo posts. `post_media` has existed since Phase 2 with no
-- writer and no storage behind it; now photos are uploaded to a private
-- Storage bucket and attached to posts. See docs/feed.md.
--
-- The bucket is private on purpose. Posts have audiences (followers,
-- friends, crew, only me) and blocks hide everything; a public bucket would
-- let anyone holding a photo's URL see it regardless. Instead, reading a
-- photo goes through the same RLS chain as reading its post:
-- storage.objects -> post_media -> posts (is_content_visible_to).

-- ---------------------------------------------------------------------------
-- 1. Bucket. Uploads are resized and re-encoded to JPEG on the phone before
--    they leave it (which also strips location metadata); 10 MB is
--    headroom, not the expected size.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. post_media points at a storage object, not a URL: a private object has
--    no permanent URL, the app asks for a short-lived signed one.
-- ---------------------------------------------------------------------------

alter table public.post_media rename column url to storage_path;

alter table public.post_media
  add constraint post_media_storage_path_format
    check (storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{8,64}\.(jpg|png|webp)$'),
  add constraint post_media_storage_path_key unique (storage_path),
  add constraint post_media_position_range check (position between 0 and 3),
  add constraint post_media_post_position_key unique (post_id, position),
  add constraint post_media_dimensions_sane
    check ((width is null or width between 1 and 10000) and (height is null or height between 1 and 10000));

-- Whether the caller uploaded this object. Security definer because the
-- insert policy below can't read storage.objects through RLS: the storage
-- read policy (section 3) reads post_media, and Postgres rejects policies
-- that reach back into their own table ("infinite recursion detected").
-- It only ever answers for the caller's own uploads.
create or replace function public.is_own_upload(p_bucket text, p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from storage.objects o
    where o.bucket_id = p_bucket
      and o.name = p_name
      and o.owner_id = (select auth.uid())::text
  );
$$;

revoke execute on function public.is_own_upload(text, text) from public, anon;
grant execute on function public.is_own_upload(text, text) to authenticated;

-- The photo must be one the author uploaded themselves. Without this, the
-- read policy below would be an exfiltration path: attach someone else's
-- friends-only photo to your own public post and everyone could read it.
-- The object must also already exist, so a post can't reference a photo
-- that never arrived.
drop policy "post_media_insert_own_post" on public.post_media;
create policy "post_media_insert_own_post" on public.post_media for insert
  with check (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
    and split_part(storage_path, '/', 1) = (select auth.uid())::text
    and public.is_own_upload('post-media', storage_path)
  );

-- Media is never edited after posting.
drop policy "post_media_update_own_post" on public.post_media;
revoke update on public.post_media from anon, authenticated;
revoke insert on public.post_media from anon, authenticated;
grant insert (post_id, media_type, storage_path, width, height, position) on public.post_media to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Storage rules for the bucket. Paths are `<user id>/<random>.<ext>`.
-- ---------------------------------------------------------------------------

-- Uploads go straight to the Storage API, so the per-table rate limits
-- (enforce_insert_rate_limit) never see them: without this, one account
-- could upload files as fast as its connection allows without ever
-- posting them. Called from each bucket's upload rule; raises the same
-- `rate_limited` error the app already explains. Security definer and
-- plpgsql so it can count the caller's uploads without re-entering
-- storage.objects' own policies; it only ever counts the caller's.
create or replace function public.check_upload_rate(p_bucket text, p_max integer, p_window interval)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  select count(*) into v_recent
  from storage.objects o
  where o.bucket_id = p_bucket
    and o.name like (select auth.uid())::text || '/%'
    and o.created_at > now() - p_window;

  if v_recent >= p_max then
    raise exception 'rate_limited' using errcode = 'P0001',
      hint = format('At most %s uploads per %s.', p_max, p_window);
  end if;
  return true;
end;
$$;

revoke execute on function public.check_upload_rate(text, integer, interval) from public, anon;
grant execute on function public.check_upload_rate(text, integer, interval) to authenticated;

create policy "post_media_objects_insert_own_folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{8,64}\.(jpg|png|webp)$'
    and not public.is_suspended((select auth.uid()))
    -- Posts are limited to 10 per 5 minutes with up to 4 photos each.
    and public.check_upload_rate('post-media', 40, '5 minutes')
  );

-- Your own uploads, plus any photo attached to a post you're allowed to
-- see. The post_media subquery runs under post_media's RLS, which runs
-- under posts' — privacy levels, blocks and suspensions all carry over.
create policy "post_media_objects_select_visible" on storage.objects for select to authenticated
  using (
    bucket_id = 'post-media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.post_media m where m.storage_path = storage.objects.name)
    )
  );

-- Lets the app clean up its own uploads when creating the post fails.
create policy "post_media_objects_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 4. Creating a post with its photos in one transaction, so followers never
--    see a photo post without its photos. Security invoker: every insert
--    still goes through posts' and post_media's RLS, grants, rate limit and
--    suspension checks exactly as a direct insert would.
-- ---------------------------------------------------------------------------

create or replace function public.create_post(
  p_body text default null,
  p_visibility text default 'everyone',
  p_crew_id uuid default null,
  p_media jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_body text := nullif(btrim(p_body), '');
  v_media jsonb := coalesce(p_media, '[]'::jsonb);
  v_post_id uuid;
  v_item record;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(v_media) <> 'array' then
    raise exception 'invalid_media' using errcode = '22023';
  end if;
  if v_body is null and jsonb_array_length(v_media) = 0 then
    raise exception 'empty_post' using errcode = '22023';
  end if;
  if char_length(v_body) > 2000 then
    raise exception 'post_too_long' using errcode = '22023';
  end if;
  if jsonb_array_length(v_media) > 4 then
    raise exception 'too_many_photos' using errcode = '22023';
  end if;

  insert into posts (author_id, kind, body, visibility, crew_id)
  values (
    v_user,
    case when jsonb_array_length(v_media) > 0 then 'image' else 'text' end,
    v_body,
    p_visibility,
    p_crew_id
  )
  returning id into v_post_id;

  for v_item in select value, ordinality from jsonb_array_elements(v_media) with ordinality loop
    insert into post_media (post_id, media_type, storage_path, width, height, position)
    values (
      v_post_id,
      'image',
      v_item.value ->> 'path',
      (v_item.value ->> 'width')::integer,
      (v_item.value ->> 'height')::integer,
      v_item.ordinality - 1
    );
  end loop;

  return v_post_id;
end;
$$;

revoke execute on function public.create_post(text, text, uuid, jsonb) from public, anon;
grant execute on function public.create_post(text, text, uuid, jsonb) to authenticated;

comment on function public.create_post is
  'Creates a post and attaches up to 4 already-uploaded photos (`[{path, width, height}]`) atomically. Runs as the caller, so posts/post_media RLS, grants, the posts rate limit and the suspension block all apply.';

-- ---------------------------------------------------------------------------
-- 5. Feed reads return each post's photos, in order.
-- ---------------------------------------------------------------------------

create or replace function public.post_media_json(p_post_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('path', m.storage_path, 'type', m.media_type, 'width', m.width, 'height', m.height)
      order by m.position
    ),
    '[]'::jsonb
  )
  from post_media m
  where m.post_id = p_post_id;
$$;

drop function public.get_home_feed(int, timestamptz, uuid);
create function public.get_home_feed(
  page_size int default 20,
  before_created_at timestamptz default null,
  before_id uuid default null
)
returns table (
  id uuid,
  author_id uuid,
  author_username text,
  author_display_name text,
  author_avatar_url text,
  city_id uuid,
  crew_id uuid,
  kind text,
  body text,
  poll_options jsonb,
  visibility text,
  created_at timestamptz,
  updated_at timestamptz,
  reaction_count bigint,
  comment_count bigint,
  viewer_has_reacted boolean,
  media jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.author_id,
    pr.username,
    pr.display_name,
    pr.avatar_url,
    p.city_id,
    p.crew_id,
    p.kind,
    p.body,
    p.poll_options,
    p.visibility,
    p.created_at,
    p.updated_at,
    coalesce(rc.count, 0),
    coalesce(cc.count, 0),
    exists (
      select 1 from reactions r
      where r.post_id = p.id and r.user_id = auth.uid()
    ),
    public.post_media_json(p.id)
  from posts p
  join profiles pr on pr.id = p.author_id
  left join lateral (
    select count(*) as count from reactions r where r.post_id = p.id
  ) rc on true
  left join lateral (
    select count(*) as count from comments c where c.post_id = p.id and c.deleted_at is null
  ) cc on true
  where p.deleted_at is null
    and (
      p.author_id = auth.uid()
      or p.author_id in (select following_id from follows where follower_id = auth.uid())
    )
    and (
      before_created_at is null
      or (p.created_at, p.id) < (before_created_at, before_id)
    )
  order by p.created_at desc, p.id desc
  limit greatest(1, least(page_size, 50));
$$;

comment on function public.get_home_feed is
  'Posts from people auth.uid() follows (plus their own), newest first, keyset-paginated via (created_at, id), each with its photos. RLS on posts still applies underneath this filter. Recency-only for now; architecture.md''s FeedRankingService (engagement/interests/city/crew weighting) is a later swap-in, not yet implemented.';

drop function public.get_post_by_id(uuid);
create function public.get_post_by_id(p_post_id uuid)
returns table (
  id uuid,
  author_id uuid,
  author_username text,
  author_display_name text,
  author_avatar_url text,
  city_id uuid,
  crew_id uuid,
  kind text,
  body text,
  poll_options jsonb,
  visibility text,
  created_at timestamptz,
  updated_at timestamptz,
  reaction_count bigint,
  comment_count bigint,
  viewer_has_reacted boolean,
  media jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.author_id,
    pr.username,
    pr.display_name,
    pr.avatar_url,
    p.city_id,
    p.crew_id,
    p.kind,
    p.body,
    p.poll_options,
    p.visibility,
    p.created_at,
    p.updated_at,
    coalesce(rc.count, 0),
    coalesce(cc.count, 0),
    exists (
      select 1 from reactions r
      where r.post_id = p.id and r.user_id = auth.uid()
    ),
    public.post_media_json(p.id)
  from posts p
  join profiles pr on pr.id = p.author_id
  left join lateral (
    select count(*) as count from reactions r where r.post_id = p.id
  ) rc on true
  left join lateral (
    select count(*) as count from comments c where c.post_id = p.id and c.deleted_at is null
  ) cc on true
  where p.id = p_post_id
    and p.deleted_at is null;
$$;

comment on function public.get_post_by_id is
  'A single post by id (with its photos) for deep links/shares/notification taps, not scoped to the follow graph. RLS on posts (posts_select_visible -> is_content_visible_to) still applies underneath, so this can only return a post the caller is actually allowed to see.';
