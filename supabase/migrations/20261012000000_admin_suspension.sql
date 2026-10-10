-- Admin dashboard (Phase 12): the primary deliverable is a real review
-- queue for `reports`, which Phase 11 deliberately left unresolvable --
-- reports' own RLS only ever let a reporter select/insert their own rows,
-- by design, with the comment "resolved_by/resolved_at... service-role
-- (admin) only". That mechanism is the service-role key from a trusted
-- server context (apps/web's existing createAdminClient(), already used by
-- account deletion), not a new Postgres-level admin role -- so no new RLS
-- policy or RPC is needed for reading/updating `reports` itself; the admin
-- client already bypasses RLS entirely by Postgres role privilege.
--
-- What *is* needed: reviewing a report against a user has to be able to
-- actually do something. There was no ban/suspend mechanism anywhere --
-- profiles.deleted_at doesn't exist (checked: it's a plain, un-soft-deleted
-- table; account deletion is already a hard delete via auth.admin.deleteUser,
-- confirmed in apps/web's account/delete route). This adds a real one.

alter table public.profiles add column suspended_at timestamptz;
alter table public.profiles add column suspended_reason text;

-- Suspension is enforced in two places, deliberately, not comprehensively:
-- is_content_visible_to() (so a suspended user's existing posts/vibes/
-- events/check_ins disappear for everyone, themselves included -- checked
-- before the viewer=owner self-visibility shortcut, so it can't be routed
-- around by viewing your own content) and the mobile app's own sign-in gate
-- (client-side, blocks a suspended user from reaching the app at all). This
-- does NOT retrofit every insert policy across the schema to also reject
-- writes from a suspended user calling the API directly, bypassing the
-- mobile client -- that's a real, broader hardening gap, flagged in
-- docs/admin-dashboard.md rather than silently assumed covered.
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
  if exists (select 1 from public.profiles where id = owner and suspended_at is not null) then
    return false;
  end if;

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
  'Single source of truth for visibility checks across posts/vibes/events/check_ins. A suspended owner''s content is hidden unconditionally (even from themselves); blocks always win otherwise (via are_blocked()); visibility enum is everyone|followers|friends|crew|only_me.';
