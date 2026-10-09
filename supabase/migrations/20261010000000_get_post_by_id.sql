-- A single post by id, for the post detail screen. Phase 10 (sharing & deep
-- links) needs this because a shared post link, or a follow/reaction/comment
-- notification's tap target, must work for a post the viewer hasn't seen in
-- their home feed yet — possibly from someone they don't even follow, if the
-- post's own visibility allows it. get_home_feed() can't be reused as-is: it
-- always filters to "people you follow plus yourself", which would make a
-- shared link to a public post from a stranger resolve to nothing.
--
-- security invoker (the default — stated explicitly), same reasoning as
-- get_home_feed: the underlying `posts` RLS policy (posts_select_visible,
-- which calls is_content_visible_to()) still applies underneath this
-- function. Dropping the follow-graph filter only widens which already-
-- visible posts can be looked up by id directly; it can never surface a post
-- RLS would otherwise hide, because RLS is enforced on the table regardless
-- of which function queries it.
create or replace function public.get_post_by_id(p_post_id uuid)
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
  viewer_has_reacted boolean
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
    )
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
  'A single post by id for deep links/shares/notification taps, not scoped to the follow graph. RLS on posts (posts_select_visible -> is_content_visible_to) still applies underneath, so this can only return a post the caller is actually allowed to see.';
