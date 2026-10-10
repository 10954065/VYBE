-- Phase 14: database performance, from `supabase db advisors`.
--
-- 1. auth_rls_initplan: policies that call auth.uid() directly re-evaluate
--    it for every row a query touches. Wrapped as (select auth.uid()),
--    Postgres evaluates it once per statement as an initplan. The
--    statements below were generated from the live policy definitions
--    (pg_policies) with only that substitution, so every rule is unchanged;
--    supabase/tests/database covers that behaviour.
--
-- 2. unindexed_foreign_keys: each foreign key gets a covering index, so
--    joins and the cascades/SET NULLs on delete don't scan the whole table.

alter policy "analytics_events_insert_any" on public."analytics_events"
  with check (((user_id IS NULL) OR (user_id = (select auth.uid()))));

alter policy "blocks_delete_self" on public."blocks"
  using ((blocker_id = (select auth.uid())));

alter policy "blocks_insert_self" on public."blocks"
  with check ((blocker_id = (select auth.uid())));

alter policy "blocks_select_own" on public."blocks"
  using ((blocker_id = (select auth.uid())));

alter policy "business_staff_manage_owner" on public."business_staff"
  using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_staff.business_id) AND (b.owner_id = (select auth.uid()))))))
  with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_staff.business_id) AND (b.owner_id = (select auth.uid()))))));

alter policy "business_staff_select_staff_or_owner" on public."business_staff"
  using (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = business_staff.business_id) AND (b.owner_id = (select auth.uid()))))) OR is_business_staff((select auth.uid()), business_id)));

alter policy "businesses_insert_self" on public."businesses"
  with check ((owner_id = (select auth.uid())));

alter policy "challenge_participants_insert_self" on public."challenge_participants"
  with check (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM challenges c
  WHERE ((c.id = challenge_participants.challenge_id) AND (c.status = 'active'::text))))));

alter policy "check_ins_insert_self" on public."check_ins"
  with check ((user_id = (select auth.uid())));

alter policy "check_ins_select_visible" on public."check_ins"
  using (((user_id = (select auth.uid())) OR is_content_visible_to((select auth.uid()), user_id, visibility, crew_id)));

alter policy "comments_insert_self" on public."comments"
  with check (((author_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = comments.post_id) AND (p.deleted_at IS NULL) AND is_content_visible_to((select auth.uid()), p.author_id, p.visibility, p.crew_id))))));

alter policy "comments_select_visible" on public."comments"
  using (((deleted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = comments.post_id) AND (p.deleted_at IS NULL) AND is_content_visible_to((select auth.uid()), p.author_id, p.visibility, p.crew_id))))));

alter policy "comments_update_self" on public."comments"
  using ((author_id = (select auth.uid())))
  with check ((author_id = (select auth.uid())));

alter policy "crew_members_delete_self_or_admin" on public."crew_members"
  using (((user_id = (select auth.uid())) OR is_crew_admin((select auth.uid()), crew_id)));

alter policy "crew_members_insert_self" on public."crew_members"
  with check ((user_id = (select auth.uid())));

alter policy "crew_members_select_visible" on public."crew_members"
  using (((user_id = (select auth.uid())) OR (get_crew_privacy(crew_id) = 'public'::text) OR is_crew_member((select auth.uid()), crew_id, true)));

alter policy "crews_insert_self" on public."crews"
  with check ((creator_id = (select auth.uid())));

alter policy "event_attendees_select_visible" on public."event_attendees"
  using (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_attendees.event_id) AND (e.deleted_at IS NULL) AND is_content_visible_to((select auth.uid()), e.organizer_id, e.visibility, e.crew_id))))));

alter policy "event_attendees_update_self_status" on public."event_attendees"
  using ((user_id = (select auth.uid())))
  with check (((user_id = (select auth.uid())) AND (status = ANY (ARRAY['interested'::text, 'going'::text, 'cancelled'::text]))));

alter policy "events_insert_self" on public."events"
  with check ((organizer_id = (select auth.uid())));

alter policy "events_select_visible" on public."events"
  using (((deleted_at IS NULL) AND is_content_visible_to((select auth.uid()), organizer_id, visibility, crew_id)));

alter policy "events_update_organizer" on public."events"
  using ((organizer_id = (select auth.uid())))
  with check ((organizer_id = (select auth.uid())));

alter policy "follows_delete_self" on public."follows"
  using ((follower_id = (select auth.uid())));

alter policy "follows_insert_self" on public."follows"
  with check (((follower_id = (select auth.uid())) AND (NOT are_blocked(follower_id, following_id))));

alter policy "notification_preferences_own" on public."notification_preferences"
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

alter policy "notifications_delete_self" on public."notifications"
  using ((user_id = (select auth.uid())));

alter policy "notifications_select_self" on public."notifications"
  using ((user_id = (select auth.uid())));

alter policy "notifications_update_self" on public."notifications"
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

alter policy "place_ratings_delete_self" on public."place_ratings"
  using ((user_id = (select auth.uid())));

alter policy "place_ratings_insert_self_with_visit" on public."place_ratings"
  with check (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM check_ins ci
  WHERE ((ci.user_id = (select auth.uid())) AND (ci.place_id = place_ratings.place_id))))));

alter policy "place_ratings_update_self" on public."place_ratings"
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

alter policy "post_media_manage_own_post" on public."post_media"
  using ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_media.post_id) AND (p.author_id = (select auth.uid()))))))
  with check ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_media.post_id) AND (p.author_id = (select auth.uid()))))));

alter policy "posts_insert_self" on public."posts"
  with check ((author_id = (select auth.uid())));

alter policy "posts_select_visible" on public."posts"
  using (((deleted_at IS NULL) AND is_content_visible_to((select auth.uid()), author_id, visibility, crew_id)));

alter policy "posts_update_self" on public."posts"
  using ((author_id = (select auth.uid())))
  with check ((author_id = (select auth.uid())));

alter policy "profiles_insert_self" on public."profiles"
  with check ((id = (select auth.uid())));

alter policy "profiles_select_visible" on public."profiles"
  using ((((deleted_at IS NULL) OR (id = (select auth.uid()))) AND (NOT are_blocked((select auth.uid()), id))));

alter policy "profiles_update_self" on public."profiles"
  using ((id = (select auth.uid())))
  with check ((id = (select auth.uid())));

alter policy "push_tokens_claim" on public."push_tokens"
  using (true)
  with check ((user_id = (select auth.uid())));

alter policy "push_tokens_delete_self" on public."push_tokens"
  using ((user_id = (select auth.uid())));

alter policy "push_tokens_insert_self" on public."push_tokens"
  with check ((user_id = (select auth.uid())));

alter policy "push_tokens_select_self" on public."push_tokens"
  using ((user_id = (select auth.uid())));

alter policy "reactions_delete_self" on public."reactions"
  using ((user_id = (select auth.uid())));

alter policy "reactions_insert_self" on public."reactions"
  with check (((user_id = (select auth.uid())) AND (((post_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = reactions.post_id) AND (p.deleted_at IS NULL) AND is_content_visible_to((select auth.uid()), p.author_id, p.visibility, p.crew_id))))) OR ((comment_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (comments c
     JOIN posts p ON ((p.id = c.post_id)))
  WHERE ((c.id = reactions.comment_id) AND (c.deleted_at IS NULL) AND (p.deleted_at IS NULL) AND is_content_visible_to((select auth.uid()), p.author_id, p.visibility, p.crew_id))))) OR ((check_in_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM check_ins ci
  WHERE ((ci.id = reactions.check_in_id) AND ((ci.user_id = (select auth.uid())) OR is_content_visible_to((select auth.uid()), ci.user_id, ci.visibility, ci.crew_id)))))))));

alter policy "reactions_select_visible" on public."reactions"
  using ((((post_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = reactions.post_id) AND (p.deleted_at IS NULL) AND is_content_visible_to((select auth.uid()), p.author_id, p.visibility, p.crew_id))))) OR ((comment_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (comments c
     JOIN posts p ON ((p.id = c.post_id)))
  WHERE ((c.id = reactions.comment_id) AND (c.deleted_at IS NULL) AND (p.deleted_at IS NULL) AND is_content_visible_to((select auth.uid()), p.author_id, p.visibility, p.crew_id))))) OR ((check_in_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM check_ins ci
  WHERE ((ci.id = reactions.check_in_id) AND ((ci.user_id = (select auth.uid())) OR is_content_visible_to((select auth.uid()), ci.user_id, ci.visibility, ci.crew_id))))))));

alter policy "reports_insert_self" on public."reports"
  with check ((reporter_id = (select auth.uid())));

alter policy "reports_select_own" on public."reports"
  using ((reporter_id = (select auth.uid())));

alter policy "saved_posts_own" on public."saved_posts"
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

alter policy "user_genres_delete_self" on public."user_genres"
  using ((user_id = (select auth.uid())));

alter policy "user_genres_insert_self" on public."user_genres"
  with check ((user_id = (select auth.uid())));

alter policy "user_interests_delete_self" on public."user_interests"
  using ((user_id = (select auth.uid())));

alter policy "user_interests_insert_self" on public."user_interests"
  with check ((user_id = (select auth.uid())));

alter policy "user_neighborhoods_delete_self" on public."user_neighborhoods"
  using ((user_id = (select auth.uid())));

alter policy "user_neighborhoods_insert_self" on public."user_neighborhoods"
  with check ((user_id = (select auth.uid())));

alter policy "vibes_delete_self" on public."vibes"
  using ((user_id = (select auth.uid())));

alter policy "vibes_insert_self" on public."vibes"
  with check ((user_id = (select auth.uid())));

alter policy "vibes_select_visible" on public."vibes"
  using (((user_id = (select auth.uid())) OR ((expires_at > now()) AND is_content_visible_to((select auth.uid()), user_id, visibility, crew_id))));

alter policy "vibes_update_self" on public."vibes"
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

create index analytics_events_city_id_idx on public.analytics_events (city_id);
create index blocks_blocked_id_idx on public.blocks (blocked_id);
create index business_staff_user_id_idx on public.business_staff (user_id);
create index businesses_owner_id_idx on public.businesses (owner_id);
create index challenge_participants_user_id_idx on public.challenge_participants (user_id);
create index check_ins_crew_id_idx on public.check_ins (crew_id);
create index crews_creator_id_idx on public.crews (creator_id);
create index events_business_id_idx on public.events (business_id);
create index events_crew_id_idx on public.events (crew_id);
create index notifications_actor_id_idx on public.notifications (actor_id);
create index reports_resolved_by_idx on public.reports (resolved_by);
create index saved_posts_post_id_idx on public.saved_posts (post_id);
create index user_badges_badge_id_idx on public.user_badges (badge_id);
create index vibes_crew_id_idx on public.vibes (crew_id);
