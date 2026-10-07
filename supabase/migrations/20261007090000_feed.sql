-- Home feed: posts authored by people the viewer follows, or by the viewer,
-- newest first, keyset-paginated via (created_at, id).
--
-- security invoker (the default — stated explicitly) so the underlying
-- `posts` RLS policy (posts_select_visible) still applies on top of the
-- following-graph filter below: a bug in this function can only narrow what
-- comes back, never widen it past what RLS already allows. auth.uid() is
-- read inside the function rather than accepted as a parameter, so a caller
-- can never request another user's feed.
create or replace function public.get_home_feed(
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
  'Posts from people auth.uid() follows (plus their own), newest first, keyset-paginated via (created_at, id). RLS on posts still applies underneath this filter. Recency-only for now; architecture.md''s FeedRankingService (engagement/interests/city/crew weighting) is a later swap-in, not yet implemented.';

-- People to suggest following: profiles that aren't the viewer and aren't
-- already followed by them. The home feed only ever shows posts from people
-- you already follow, so without this a newly onboarded user (following
-- nobody) would have no way to populate their feed before Discovery
-- (Phase 9's search/trending/recommendations) exists.
create or replace function public.get_suggested_people(result_limit int default 10)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  select pr.id, pr.username, pr.display_name, pr.avatar_url
  from profiles pr
  where pr.id <> auth.uid()
    and pr.deleted_at is null
    and not exists (
      select 1 from follows f
      where f.follower_id = auth.uid() and f.following_id = pr.id
    )
  order by pr.created_at desc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.get_suggested_people is
  'Profiles auth.uid() does not already follow, for the home feed''s empty-state "follow people" strip. Not Discovery (Phase 9) — no search, ranking, or interest matching, just enough to unblock an empty feed.';
