-- Helper functions shared by every later migration.
-- gen_random_uuid() is built into core Postgres (13+); no extension needed.

-- Generic "touch updated_at" trigger, attached per-table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Content visibility, shared by posts/vibes/events/check_ins.
-- SECURITY DEFINER so it can read follows/crew_members/blocks regardless of
-- the caller's own RLS grants on those tables (avoids RLS recursion), while
-- still only ever answering a yes/no visibility question for the given row.
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

  -- A block in either direction hides content unconditionally.
  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = viewer and b.blocked_id = owner)
       or (b.blocker_id = owner and b.blocked_id = viewer)
  ) then
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
  'Single source of truth for visibility checks across posts/vibes/events/check_ins. Blocks always win; visibility enum is everyone|followers|friends|crew|only_me.';
