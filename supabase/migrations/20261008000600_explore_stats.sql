-- Supporting RPCs for the Explore (Discover) screen's real "Trending
-- Spots" list (ratings + recent check-in counts flattened onto places) and
-- "Curated Events" list (attendee counts flattened onto events, like Home's
-- highlight events but without the next-18h window).

create or replace function public.get_places_with_stats(p_city_id uuid, result_limit int default 50)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  category text,
  address text,
  city_id uuid,
  lat double precision,
  lng double precision,
  cover_image_url text,
  business_id uuid,
  popularity_score numeric,
  created_at timestamptz,
  updated_at timestamptz,
  avg_rating numeric,
  rating_count bigint,
  recent_check_in_count bigint
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
    ), 0)
  from places p
  left join place_rating_aggregates ra on ra.place_id = p.id
  where p.city_id = p_city_id and p.deleted_at is null
  order by p.popularity_score desc, p.name asc
  limit greatest(1, least(result_limit, 100));
$$;

comment on function public.get_places_with_stats is
  'Places in a city with real rating aggregates and recent check-in counts flattened in. security invoker: check_ins/places RLS still applies underneath.';

create or replace function public.get_events_with_stats(p_city_id uuid, result_limit int default 50)
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  cover_image_url text,
  category text,
  place_id uuid,
  place_name text,
  start_at timestamptz,
  end_at timestamptz,
  price_label text,
  interested_count bigint,
  going_count bigint,
  viewer_status text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.id, e.title, e.slug, e.description, e.cover_image_url, e.category, e.place_id, pl.name,
    e.start_at, e.end_at, e.price_label,
    coalesce(att.interested_count, 0), coalesce(att.going_count, 0), att.viewer_status
  from events e
  left join places pl on pl.id = e.place_id
  left join lateral public.get_event_attendee_summary(e.id) att on true
  where e.city_id = p_city_id
    and e.status = 'published'
    and e.deleted_at is null
    and e.start_at >= now()
    and public.is_content_visible_to(auth.uid(), e.organizer_id, e.visibility, e.crew_id)
  order by e.start_at asc
  limit greatest(1, least(result_limit, 100));
$$;

comment on function public.get_events_with_stats is
  'Upcoming published events in a city with real attendee counts flattened in — Discover''s broader list vs. Home''s next-18h highlight events.';
