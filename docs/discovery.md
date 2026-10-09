# Discovery: search, trending, recommendations

## Where this came from

Explore's Stitch design (`discover_accra_social_discovery`) already had most of its own screen built across earlier phases — ratings, distance, the busiest-place banner, place/event stat cards — everything except the search bar itself and the "For You"/"Trending" filter chips the export shows. This phase builds those, plus found and fixed one real bug the export's own "Trending Spots" label exposed.

## A real bug found before anything new was built

Explore's "Trending" place sort has existed since the second Stitch pass, but it was a no-op: the sort switch statement had branches for `rated` and `nearby`, and silently fell through to "whatever order the RPC returned" for `trending` — which was `places.popularity_score desc`, a static number hand-seeded in `supabase/seed.sql` that no trigger ever updates. "Trending" was sorting by a frozen number from the day the city was seeded, never by anything that actually happened. Fixed by sorting by `recent_check_in_count` (a real, already-computed 4-hour window `get_places_with_stats` was already returning but nothing read for this purpose) instead. No schema change needed — the real data was already there, just unused.

## Search

`search_people`/`search_places`/`search_events`/`search_crews` (`20261009000000_search.sql`) replace Explore's old search box, which only ever did a client-side substring filter over whatever places/events the current tab had already loaded — no people, no crews, nothing server-side.

Matching is `ilike '%query%' OR similarity(name, query) > 0.3` via `pg_trgm`, not either alone:
- A plain `ilike` reliably catches the common case (typing a correctly-spelled fragment).
- Trigram similarity catches real typos `ilike` can't — verified directly: `'beachfrnt grill'` has zero substring overlap with `'Osu Beachfront Grill'` and would never match on `ilike` alone, but scores `similarity = 0.61` and is found. `0.3` is `pg_trgm`'s own documented default threshold.

Every result type respects the same RLS/visibility the rest of the app already enforces (`is_content_visible_to` for events, `profiles_select_visible` for people, etc.) — `security invoker` throughout, nothing bypassed.

The search bar lives inline on Explore, matching the Stitch export exactly (it never exports to its own screen). While searching, the normal Places/Events segmented browse view is replaced by four categorized result sections (People/Places/Events/Crews); clearing the box reverts to normal browsing. Copy is `"Search places, people, events, or crews..."` — the export's copy also says "vibes," dropped here since vibes are ephemeral live-status posts with no name to search by, not a real fourth result category.

## Trending and "For You"

Trending for events is new (places' fix is above): sorts by `interested_count + going_count`, both already-real totals.

"For You" is the Stitch chip this pass actually had to build from nothing — no ML, no fabricated score. `get_recommended_places`/`get_recommended_events`/`get_recommended_crews` (`20261009000100_recommendations.sql`) rank by one real signal this app already has: how many of the viewer's friends have already been there/are going/are already a member, via `are_friends()` — exactly the use its own migration comment anticipated back when it was written ("discover's social-proof chips"). Overall popularity breaks ties and covers viewers with few or no friends yet. Each recommendation excludes what the viewer has already done (checked in, RSVPd, joined) — recommending something already done isn't a recommendation.

**Interest-based matching was considered and dropped.** `places.category` is a closed venue-type vocabulary (restaurants/clubs/cafes/...) with almost no overlap against `user_interests`' activity vocabulary (music/food/parties/...) — and onboarding doesn't even collect real per-user interests today: every user ends up with the same hardcoded `{music, nightlife}` pair (`apps/mobile/src/app/(onboarding)/index.tsx`'s form defaults, never actually asked). That's a real, pre-existing gap — flagged here, not fixed here, since fixing it is an onboarding-flow change, not a Discovery one. The friend-graph signal needed neither problem solved.

Each recommendation RPC returns the exact same column shape as its sibling `get_places_with_stats`/`get_events_with_stats` (or the full `crews` row) plus one `friend_*_count` column, built via `.extend()` on the existing Zod schemas rather than hand-duplicated — so the client reuses `ExplorePlaceCard`/`HighlightEventCard`/`CrewCard` directly instead of growing a parallel set, and a new `SocialProofLine` component renders "🙋 N friends have been here" (correctly conjugated for N=1) wherever a friend count is present and positive.

"For You" places/events live on Explore; "For You" crews live on the Crews hub's own Explore sub-tab instead (crews already have their own discovery surface there — adding a third entity type to Explore would have cluttered a screen that's already Places/Events).

## The public profile view this all exposed a need for

Search can surface people, and Phase 8's follow notifications always had an unresolvable `target_type: 'profile'` tap target — there was no screen anywhere in the app to view another user's profile. `/profile/[id]` fixes both: avatar, display name, bio, follower/following counts (`get_profile_follow_counts`), a mutual-friends line (`get_social_proof`, same function that already powers Home's presence strip), and a working Follow/Following button (`useToggleFollow`, now also invalidating the new profile-view queries on success). It's deliberately lean — not a mirror of the owner's own Profile tab (no check-in timeline, no trophy case) — just enough to act on someone you found.

One real routing risk was checked, not assumed: Expo Router resolves static routes (`profile/settings.tsx`, `profile/edit.tsx`) before the new dynamic `profile/[id].tsx`, confirmed live — navigating to `/profile/settings` still renders Settings, not a "settings" parsed as a UUID redirect.

## Verified

Every RPC was exercised directly against live Postgres first: fuzzy and exact search across all four entity types (including the self-exclusion and visibility checks), the full friend-recommendation ranking and exclusion logic for places/events/crews with real mutual-follow setups, and `get_profile_follow_counts`. Then end-to-end through the real browser: typing a real typo into Explore's search box and getting the right place back, tapping a person result into the new profile screen and following them live (follower count updated immediately), the "Trending" fix changing place order to match real recent check-ins, "For You" chips on Explore and the Crews hub correctly excluding already-done items and showing the right social-proof line with correct singular/plural grammar, and static profile routes (`settings`, `edit`) continuing to resolve correctly alongside the new dynamic one.
