-- Phase 9 (Discovery), part 2: "For You" recommendations. No ML, no
-- fabricated score — every rank here is a real signal this app already
-- has. The strongest one, "N of your friends have been here/are
-- going/are in this crew," reuses are_friends() exactly as its own
-- migration comment anticipated ("discover's social-proof chips").
-- Popularity (recent check-ins, attendee counts, member_count) breaks ties
-- and covers users with few or no friends yet.
--
-- Interest-based matching was considered and dropped: places.category is a
-- closed venue-type vocabulary (restaurants/clubs/cafes/...) with almost no
-- overlap against user_interests' activity vocabulary (music/food/
-- parties/...), and onboarding doesn't currently collect real per-user
-- interests anyway (every user ends up with the same hardcoded
-- {music, nightlife} pair — a pre-existing gap, not something this pass
-- fixes). Friend-graph + popularity needed neither.
--
-- All three take no city parameter, unlike get_*_with_stats — like
-- get_my_crews/get_my_profile_stats, "for me" is derived from auth.uid()'s
-- own profile, not passed in. Each returns the same column shape as its
-- *_with_stats sibling (places/events) or the full crews row, plus one
-- extra friend_*_count column, so the client reuses the exact same card
-- components rather than growing a parallel set.

create or replace function public.get_recommended_places(result_limit int default 10)
returns table (
  id uuid, name text, slug text, description text, category text, address text, city_id uuid,
  lat double precision, lng double precision, cover_image_url text, business_id uuid,
  popularity_score numeric, created_at timestamptz, updated_at timestamptz,
  avg_rating numeric, rating_count bigint, recent_check_in_count bigint, friend_check_in_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id, p.name, p.slug, p.description, p.category, p.address, p.city_id, p.lat, p.lng,
    p.cover_image_url, p.business_id, p.popularity_score, p.created_at, p.updated_at,
    ra.avg_rating, coalesce(ra.rating_count, 0),
    coalesce((
      select count(*) from check_ins ci
      where ci.place_id = p.id and ci.visibility <> 'only_me' and ci.created_at > now() - interval '4 hours'
    ), 0),
    coalesce((
      select count(distinct ci.user_id) from check_ins ci
      where ci.place_id = p.id and ci.visibility <> 'only_me' and public.are_friends(auth.uid(), ci.user_id)
    ), 0) as friend_check_in_count
  from places p
  left join place_rating_aggregates ra on ra.place_id = p.id
  where p.deleted_at is null
    and p.city_id = (select city_id from profiles where id = auth.uid())
    and not exists (select 1 from check_ins ci where ci.place_id = p.id and ci.user_id = auth.uid())
  order by friend_check_in_count desc, p.popularity_score desc, coalesce(ra.avg_rating, 0) desc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.get_recommended_places is
  'Places in the viewer''s city they have never checked into, ranked by how many of their friends have (then overall popularity/rating as a tiebreaker). Same column shape as get_places_with_stats plus friend_check_in_count, so the client reuses ExplorePlaceCard. security invoker: check_ins/places RLS still applies underneath.';

create or replace function public.get_recommended_events(result_limit int default 10)
returns table (
  id uuid, title text, slug text, description text, cover_image_url text, category text,
  place_id uuid, place_name text, start_at timestamptz, end_at timestamptz, price_label text,
  interested_count bigint, going_count bigint, viewer_status text, friend_going_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.id, e.title, e.slug, e.description, e.cover_image_url, e.category, e.place_id, pl.name,
    e.start_at, e.end_at, e.price_label,
    coalesce(att.interested_count, 0), coalesce(att.going_count, 0), att.viewer_status,
    coalesce((
      select count(*) from event_attendees ea
      where ea.event_id = e.id and ea.status in ('going', 'checked_in') and public.are_friends(auth.uid(), ea.user_id)
    ), 0) as friend_going_count
  from events e
  left join places pl on pl.id = e.place_id
  left join lateral public.get_event_attendee_summary(e.id) att on true
  where e.city_id = (select city_id from profiles where id = auth.uid())
    and e.status = 'published'
    and e.deleted_at is null
    and e.start_at >= now()
    and public.is_content_visible_to(auth.uid(), e.organizer_id, e.visibility, e.crew_id)
    and not exists (select 1 from event_attendees ea where ea.event_id = e.id and ea.user_id = auth.uid())
  order by friend_going_count desc, coalesce(att.going_count, 0) desc, e.start_at asc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.get_recommended_events is
  'Upcoming events in the viewer''s city they haven''t RSVPd to, ranked by how many friends are going, then total going_count. Same column shape as get_events_with_stats plus friend_going_count, so the client reuses HighlightEventCard.';

create or replace function public.get_recommended_crews(result_limit int default 10)
returns table (
  id uuid, name text, slug text, description text, avatar_url text, cover_image_url text,
  category text, city_id uuid, creator_id uuid, privacy text, member_count integer,
  created_at timestamptz, updated_at timestamptz, friend_member_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id, c.name, c.slug, c.description, c.avatar_url, c.cover_image_url, c.category, c.city_id,
    c.creator_id, c.privacy, c.member_count, c.created_at, c.updated_at,
    coalesce((
      select count(*) from crew_members cm
      where cm.crew_id = c.id and cm.status = 'approved' and public.are_friends(auth.uid(), cm.user_id)
    ), 0) as friend_member_count
  from crews c
  where c.deleted_at is null
    and (c.city_id is null or c.city_id = (select city_id from profiles where id = auth.uid()))
    and not exists (select 1 from crew_members cm where cm.crew_id = c.id and cm.user_id = auth.uid())
  order by friend_member_count desc, c.member_count desc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.get_recommended_crews is
  'Crews the viewer hasn''t joined, in their city (or city-less crews), ranked by how many friends are already approved members, then total member_count. Same column shape as the full crews row plus friend_member_count, so the client reuses CrewCard.';

-- Follower/following counts for the new public profile view screen —
-- aggregate-only, same posture as crews.member_count: a count alone
-- doesn't expose the follower/following list itself (follows rows already
-- are, via follows_select_all, but this spares the client two extra
-- queries just to show two numbers).
create or replace function public.get_profile_follow_counts(p_profile_id uuid)
returns table (follower_count bigint, following_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from follows where following_id = p_profile_id),
    (select count(*) from follows where follower_id = p_profile_id);
$$;

comment on function public.get_profile_follow_counts is
  'Follower/following counts for any profile. security definer purely to avoid two round trips — follows itself is already fully public via follows_select_all.';
