-- Phase 14: security hardening.
--
-- Driven by `supabase db advisors` plus live exploit attempts through the
-- real API (see docs/security.md). Before this migration, these succeeded:
--   * a suspended user cleared their own suspension (any profile column
--     was writable by its owner);
--   * a crew admin moved their own membership row into another crew as its
--     owner (crew_members UPDATE had WITH CHECK (true));
--   * anyone joined any crew, private ones included, as an approved owner
--     (role was client-settable, and non-member roles skip approval);
--   * a report could be filed already dismissed, hiding it from moderators.
-- supabase/tests/database/010_privilege_escalation.test.sql keeps them closed.

-- ---------------------------------------------------------------------------
-- 1. Column-level UPDATE grants.
--
-- RLS decides which rows a user may update; it can't say which columns.
-- Table-level UPDATE is replaced by a grant on exactly the columns a user
-- may edit, so server-maintained fields (suspension, onboarding state,
-- counters, verification, ownership) can't be written from the API.
-- Triggers and RPCs that maintain those fields are SECURITY DEFINER and are
-- unaffected.
-- ---------------------------------------------------------------------------

revoke update on public.profiles from anon, authenticated;
grant update (
  display_name, bio, avatar_url, city_id,
  travel_radius, nightlife_pace, crew_preference, default_check_in_visibility
) on public.profiles to authenticated;
-- Profiles are only ever created by the on_auth_user_created trigger.
revoke insert on public.profiles from anon, authenticated;

revoke update on public.crews from anon, authenticated;
grant update (name, description, avatar_url, cover_image_url, category, privacy)
  on public.crews to authenticated;

revoke update on public.crew_members from anon, authenticated;
grant update (role, status) on public.crew_members to authenticated;

revoke update on public.businesses from anon, authenticated;
grant update (name, description, category, logo_url, cover_image_url, website_url)
  on public.businesses to authenticated;

revoke update on public.places from anon, authenticated;
grant update (name, description, category, address, lat, lng, cover_image_url)
  on public.places to authenticated;

revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- The same applies on INSERT. Before this, a user could join any crew —
-- private ones included — with role = 'owner', which set_crew_member_status
-- auto-approves (it only holds plain members for approval); create a crew
-- with a made-up member_count; create a business already `verified`; or
-- file a report that's already `dismissed`, hiding it from moderators.
-- Each table now accepts only the columns its client actually sends.
revoke insert on public.crew_members from anon, authenticated;
grant insert (crew_id, user_id) on public.crew_members to authenticated;

revoke insert on public.crews from anon, authenticated;
grant insert (name, slug, description, category, city_id, creator_id, privacy, avatar_url, cover_image_url)
  on public.crews to authenticated;

revoke insert on public.businesses from anon, authenticated;
grant insert (name, slug, description, category, city_id, owner_id, logo_url, cover_image_url, website_url)
  on public.businesses to authenticated;

revoke insert on public.reports from anon, authenticated;
grant insert (reporter_id, target_type, target_id, category, details) on public.reports to authenticated;

-- RSVPs can't be inserted as already checked in: `checked_in` is set only by
-- the check-in trigger, and it's what event-attendance XP is awarded for.
-- (The UPDATE policy already restricted this; the INSERT one didn't.)
alter policy event_attendees_insert_self on public.event_attendees
  with check (user_id = (select auth.uid()) and status in ('interested', 'going', 'cancelled'));

-- Timestamps on user-created rows come from the server. A client-supplied
-- created_at could backdate a check-in past the 120-second check-in limit,
-- fake streak days, or slip under the rate limits below.
create or replace function public.stamp_created_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.created_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'posts', 'comments', 'reactions', 'check_ins', 'vibes', 'events', 'crews', 'follows',
    'reports', 'place_ratings', 'saved_posts', 'blocks', 'businesses'
  ] loop
    execute format(
      'create trigger %I before insert on public.%I for each row execute function public.stamp_created_at()',
      t || '_stamp_created_at', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. UPDATE policies whose WITH CHECK was `true`: the new row must satisfy
--    the same rule as the old one. Owner is reserved: an admin can't
--    promote anyone (themselves included) to it.
-- ---------------------------------------------------------------------------

alter policy crew_members_update_admins on public.crew_members
  using (public.is_crew_admin((select auth.uid()), crew_id))
  with check (public.is_crew_admin((select auth.uid()), crew_id) and role in ('member', 'admin'));

alter policy crews_update_admins on public.crews
  using (creator_id = (select auth.uid()) or public.is_crew_admin((select auth.uid()), id))
  with check (creator_id = (select auth.uid()) or public.is_crew_admin((select auth.uid()), id));

alter policy businesses_update_staff on public.businesses
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.business_staff bs
      where bs.business_id = businesses.id and bs.user_id = (select auth.uid()) and bs.role in ('owner', 'manager')
    )
  )
  with check (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.business_staff bs
      where bs.business_id = businesses.id and bs.user_id = (select auth.uid()) and bs.role in ('owner', 'manager')
    )
  );

alter policy places_update_business_staff on public.places
  using (
    business_id is not null
    and exists (
      select 1 from public.business_staff bs
      where bs.business_id = places.business_id and bs.user_id = (select auth.uid()) and bs.role in ('owner', 'manager')
    )
  )
  with check (
    business_id is not null
    and exists (
      select 1 from public.business_staff bs
      where bs.business_id = places.business_id and bs.user_id = (select auth.uid()) and bs.role in ('owner', 'manager')
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Views run with the caller's permissions, not the owner's. Both read
--    tables whose SELECT policy is already public (the leaderboard and place
--    ratings), so results don't change — but they no longer bypass RLS.
-- ---------------------------------------------------------------------------

alter view public.user_xp_totals set (security_invoker = true);
alter view public.place_rating_aggregates set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- 4. Pin search_path on the functions that didn't.
-- ---------------------------------------------------------------------------

alter function public.set_updated_at() set search_path = public;
alter function public.level_for_xp(bigint) set search_path = public;
alter function public.analytics_events_stamp_created_at() set search_path = public;

-- ---------------------------------------------------------------------------
-- 5. Suspended users can't create or edit content through the API.
--
-- Phase 12 hid a suspended user's content and replaced the app with a
-- suspended screen, but a still-valid token could keep writing rows.
-- RESTRICTIVE policies are ANDed with every permissive one, so this adds
-- the rule to each table without touching its existing policies. Reads and
-- deletes are untouched: the app still has to load the user's own profile
-- to show the suspended screen.
-- ---------------------------------------------------------------------------

create or replace function public.is_suspended(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = p_user_id and suspended_at is not null);
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'posts', 'comments', 'reactions', 'check_ins', 'vibes', 'events', 'event_attendees',
    'crews', 'crew_members', 'follows', 'challenge_participants', 'post_media',
    'saved_posts', 'place_ratings', 'reports', 'blocks'
  ] loop
    execute format(
      'create policy %I on public.%I as restrictive for insert to authenticated
         with check (not public.is_suspended((select auth.uid())))',
      t || '_insert_not_suspended', t
    );
  end loop;

  foreach t in array array[
    'posts', 'comments', 'vibes', 'events', 'event_attendees', 'crews', 'crew_members', 'place_ratings'
  ] loop
    execute format(
      'create policy %I on public.%I as restrictive for update to authenticated
         using (not public.is_suspended((select auth.uid())))',
      t || '_update_not_suspended', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Rate limits on the writes that fan out to other people (posts,
--    comments, reports) or that anyone can spam (analytics). Same shape as
--    the existing check-in limit: a BEFORE INSERT trigger counting the
--    actor's recent rows. Arguments: actor column, window, max rows.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_insert_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_column text := tg_argv[0];
  v_window interval := tg_argv[1]::interval;
  v_max integer := tg_argv[2]::integer;
  v_actor uuid;
  v_recent integer;
begin
  execute format('select ($1).%I', v_actor_column) into v_actor using new;
  -- Anonymous analytics events have no actor to limit by.
  if v_actor is null then
    return new;
  end if;

  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - $2',
    tg_table_schema, tg_table_name, v_actor_column
  ) into v_recent using v_actor, v_window;

  if v_recent >= v_max then
    raise exception 'rate_limited' using errcode = 'P0001',
      hint = format('At most %s per %s.', v_max, v_window);
  end if;
  return new;
end;
$$;

create trigger posts_rate_limit
  before insert on public.posts
  for each row execute function public.enforce_insert_rate_limit('author_id', '5 minutes', '10');

create trigger comments_rate_limit
  before insert on public.comments
  for each row execute function public.enforce_insert_rate_limit('author_id', '1 minute', '15');

create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.enforce_insert_rate_limit('reporter_id', '1 hour', '20');

create trigger analytics_events_rate_limit
  before insert on public.analytics_events
  for each row execute function public.enforce_insert_rate_limit('user_id', '5 minutes', '500');

-- Indexes the limits count against (posts already has author_id).
create index comments_author_id_created_at_idx on public.comments (author_id, created_at desc);
create index reports_reporter_id_created_at_idx on public.reports (reporter_id, created_at desc);
drop index if exists public.analytics_events_user_id_idx;
create index analytics_events_user_id_created_at_idx
  on public.analytics_events (user_id, created_at desc) where user_id is not null;
