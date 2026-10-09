-- Phase 9 (Discovery), part 1: real cross-entity search. Explore's search
-- box has existed since Phase 5 but only ever did a client-side substring
-- filter over whatever places/events were already loaded for the current
-- tab — no people, no crews, nothing server-side. This adds the real
-- thing: fuzzy, ranked search across all four nameable entities in the app.
--
-- Matching is `ilike '%query%' OR similarity(name, query) > 0.3` on
-- purpose, not similarity alone: a plain ilike catches the common case
-- (typing a correctly-spelled fragment of a longer name) reliably, which
-- trigram similarity alone cannot guarantee for every substring (a short,
-- heavily-truncated fragment can score under threshold even when it's an
-- exact substring). Trigram similarity earns its place as the typo-
-- tolerant half of the OR — verified: 'beachfrnt grill' has zero substring
-- overlap with 'Osu Beachfront Grill' and would never match on ilike
-- alone, but scores similarity 0.61 and is found. 0.3 is pg_trgm's own
-- documented default similarity_threshold, not picked blind. Both paths
-- rank by the same similarity score either way.

create extension if not exists pg_trgm;

create index profiles_username_trgm_idx on public.profiles using gin (username gin_trgm_ops);
create index profiles_display_name_trgm_idx on public.profiles using gin (display_name gin_trgm_ops);
create index places_name_trgm_idx on public.places using gin (name gin_trgm_ops);
create index events_title_trgm_idx on public.events using gin (title gin_trgm_ops);
create index crews_name_trgm_idx on public.crews using gin (name gin_trgm_ops);

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
  'Fuzzy username/display_name search: ilike substring OR pg_trgm similarity > 0.3, ranked by similarity. Excludes self and deleted profiles. security invoker: profiles_select_visible already allows any non-deleted profile.';

create or replace function public.search_places(p_query text, p_city_id uuid, result_limit int default 10)
returns table (id uuid, name text, slug text, category text, address text, cover_image_url text)
language sql
stable
security invoker
set search_path = public
as $$
  select p.id, p.name, p.slug, p.category, p.address, p.cover_image_url
  from places p
  where length(p_query) >= 2
    and p.city_id = p_city_id
    and p.deleted_at is null
    and (p.name ilike '%' || p_query || '%' or similarity(p.name, p_query) > 0.3)
  order by similarity(p.name, p_query) desc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.search_places is
  'Fuzzy place-name search (ilike OR similarity > 0.3), scoped to a city. security invoker: places_select_all already allows this.';

create or replace function public.search_events(p_query text, p_city_id uuid, result_limit int default 10)
returns table (id uuid, title text, slug text, cover_image_url text, place_name text, start_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select e.id, e.title, e.slug, e.cover_image_url, pl.name, e.start_at
  from events e
  left join places pl on pl.id = e.place_id
  where length(p_query) >= 2
    and e.city_id = p_city_id
    and e.status = 'published'
    and e.deleted_at is null
    and e.start_at >= now()
    and (e.title ilike '%' || p_query || '%' or similarity(e.title, p_query) > 0.3)
    and public.is_content_visible_to(auth.uid(), e.organizer_id, e.visibility, e.crew_id)
  order by similarity(e.title, p_query) desc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.search_events is
  'Fuzzy upcoming-event-title search (ilike OR similarity > 0.3), scoped to a city and to events the caller can see (is_content_visible_to).';

create or replace function public.search_crews(p_query text, result_limit int default 10)
returns table (id uuid, name text, slug text, category text, avatar_url text, member_count integer)
language sql
stable
security invoker
set search_path = public
as $$
  select c.id, c.name, c.slug, c.category, c.avatar_url, c.member_count
  from crews c
  where length(p_query) >= 2
    and c.deleted_at is null
    and (c.name ilike '%' || p_query || '%' or similarity(c.name, p_query) > 0.3)
  order by similarity(c.name, p_query) desc
  limit greatest(1, least(result_limit, 25));
$$;

comment on function public.search_crews is
  'Fuzzy crew-name search (ilike OR similarity > 0.3), not city-scoped (crews are discoverable regardless of city, same as crews_select_visible). security invoker: that policy already allows this.';
