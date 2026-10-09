-- Moderation & safety: `reports` and `blocks` have existed since Phase 2
-- with no writer and no reader except is_content_visible_to(), which already
-- inlines a bidirectional block check ("blocks always win"). This migration
-- extracts that into a shared helper and wires blocking into everywhere a
-- block should have applied but didn't: profile visibility, following,
-- people search/suggestions, friend-signal-based recommendations (via
-- are_friends(), which every one of them already calls), and reaction
-- inserts, which turn out to have had no visibility gate at all.

-- Bidirectional block check, shared by every policy/function below instead
-- of each reimplementing the same EXISTS. security definer: callers only
-- have RLS access to blocks they created as blocker (blocks_select_own), so
-- a plain invoker-rights query from the blocked side would silently miss
-- the row. This mirrors why is_content_visible_to() itself is definer.
create or replace function public.are_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

comment on function public.are_blocked is
  'Bidirectional block check shared by is_content_visible_to(), are_friends(), profiles_select_visible, follows_insert_self, search_people, and get_suggested_people.';

create or replace function public.is_content_visible_to(
  viewer uuid,
  owner uuid,
  visibility text,
  content_crew_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if viewer is not null and viewer = owner then
    return true;
  end if;

  if viewer is null then
    return visibility = 'everyone';
  end if;

  if public.are_blocked(viewer, owner) then
    return false;
  end if;

  case visibility
    when 'everyone' then
      return true;
    when 'only_me' then
      return false;
    when 'followers' then
      return exists (
        select 1 from public.follows f
        where f.follower_id = viewer and f.following_id = owner
      );
    when 'friends' then
      return exists (
        select 1 from public.follows f1
        where f1.follower_id = viewer and f1.following_id = owner
      ) and exists (
        select 1 from public.follows f2
        where f2.follower_id = owner and f2.following_id = viewer
      );
    when 'crew' then
      return content_crew_id is not null and exists (
        select 1 from public.crew_members cm
        where cm.crew_id = content_crew_id
          and cm.user_id = viewer
          and cm.status = 'approved'
      );
    else
      return false;
  end case;
end;
$$;

comment on function public.is_content_visible_to is
  'Single source of truth for visibility checks across posts/vibes/events/check_ins. Blocks always win (via are_blocked()); visibility enum is everyone|followers|friends|crew|only_me.';

-- are_friends() now also returns false across a block, even though in
-- practice unfollow_on_block() (below) and follows_insert_self's new check
-- mean a mutual-follow + blocked state shouldn't be reachable going
-- forward — this covers any row that predates this migration.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    a is not null and b is not null and a <> b
    and not public.are_blocked(a, b)
    and exists (select 1 from public.follows where follower_id = a and following_id = b)
    and exists (select 1 from public.follows where follower_id = b and following_id = a);
$$;

comment on function public.are_friends is
  'Two profiles are "friends" iff they mutually follow each other and are not blocked in either direction — the same definition is_content_visible_to() uses for its friends visibility case. There is no separate friends table.';

-- Profile visibility is symmetric: if A blocked B, neither can see the
-- other's profile. The blocker still needs to read the profiles of people
-- they blocked for their own blocked-users management screen -- that's
-- get_my_blocks() below, a narrow, deliberate, security-definer exception
-- to this policy rather than a hole in it.
drop policy "profiles_select_visible" on public.profiles;
create policy "profiles_select_visible"
  on public.profiles for select
  using (
    (deleted_at is null or id = auth.uid())
    and not public.are_blocked(auth.uid(), id)
  );

-- Can't follow someone you've blocked or who has blocked you.
drop policy "follows_insert_self" on public.follows;
create policy "follows_insert_self"
  on public.follows for insert
  with check (
    follower_id = auth.uid()
    and not public.are_blocked(follower_id, following_id)
  );

-- Blocking severs any existing follow relationship in both directions —
-- otherwise "blocks always win" would be contradicted by a stale mutual
-- follow (and are_friends()/friend-signal recommendations) surviving a
-- block that predates this trigger's install.
create or replace function public.unfollow_on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end;
$$;

create trigger unfollow_on_block
  after insert on public.blocks
  for each row execute function public.unfollow_on_block();

-- reactions_insert_self had no visibility gate at all (unlike comments,
-- which already required is_content_visible_to on the target post) --
-- anyone could insert a reaction row against any post/comment/check_in
-- regardless of visibility or blocks, inflating reaction_count for content
-- they were never allowed to see. Mirrors reactions_select_visible's own
-- three-way (post/comment/check_in) shape exactly.
drop policy "reactions_insert_self" on public.reactions;
create policy "reactions_insert_self"
  on public.reactions for insert
  with check (
    user_id = auth.uid()
    and (
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
      or
      (check_in_id is not null and exists (
        select 1 from public.check_ins ci
        where ci.id = reactions.check_in_id
          and (ci.user_id = auth.uid() or public.is_content_visible_to(auth.uid(), ci.user_id, ci.visibility, ci.crew_id))
      ))
    )
  );

-- search_people and get_suggested_people query `profiles` directly (not
-- through is_content_visible_to, which is for posts/vibes/events/check_ins)
-- and profiles_select_visible above already excludes blocked-either-way
-- rows, so both are fixed by that RLS change alone. Recreated anyway with
-- an explicit filter so the exclusion is legible here too, not just an
-- invisible side effect of RLS someone has to go find.
create or replace function public.search_people(p_query text, result_limit int default 10)
returns table (id uuid, username text, display_name text, avatar_url text)
language sql
stable
security invoker
set search_path = public
as $$
  select pr.id, pr.username, pr.display_name, pr.avatar_url
  from profiles pr
  where length(p_query) >= 2
    and pr.id <> auth.uid()
    and pr.deleted_at is null
    and not public.are_blocked(auth.uid(), pr.id)
    and (
      pr.username ilike '%' || p_query || '%'
      or pr.display_name ilike '%' || p_query || '%'
      or similarity(pr.username, p_query) > 0.3
      or similarity(coalesce(pr.display_name, ''), p_query) > 0.3
    )
  order by greatest(similarity(pr.username, p_query), similarity(coalesce(pr.display_name, ''), p_query)) desc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.search_people is
  'Fuzzy username/display_name search: ilike substring OR pg_trgm similarity > 0.3, ranked by similarity. Excludes self, deleted profiles, and blocked-either-direction profiles. security invoker: profiles_select_visible already enforces both deletion and block checks.';

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
    and not public.are_blocked(auth.uid(), pr.id)
    and not exists (
      select 1 from follows f
      where f.follower_id = auth.uid() and f.following_id = pr.id
    )
  order by pr.created_at desc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.get_suggested_people is
  'Profiles auth.uid() does not already follow and is not blocked with, for the home feed''s empty-state "follow people" strip. Not Discovery (Phase 9) -- no search, ranking, or interest matching, just enough to unblock an empty feed.';

-- The blocked-users management screen needs to show who you've blocked
-- (username/display_name/avatar) even though profiles_select_visible now
-- hides those same profiles from general queries. security definer, and
-- deliberately narrow: scoped to blocker_id = auth.uid() only, so this can
-- never be used to look up anyone except people the caller themselves
-- blocked.
create or replace function public.get_my_blocks()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  blocked_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select pr.id, pr.username, pr.display_name, pr.avatar_url, b.created_at
  from blocks b
  join profiles pr on pr.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc;
$$;

comment on function public.get_my_blocks is
  'The caller''s own block list with display info, for the blocked-users settings screen. security definer and scoped to blocker_id = auth.uid() so it can only ever return people the caller themselves blocked -- a deliberate, narrow exception to profiles_select_visible''s now-symmetric block hiding.';
