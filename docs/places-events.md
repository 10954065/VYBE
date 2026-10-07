# Places, Events, Vibes & Check-ins

## Architecture

- **Places**: read-only browse for now. `places_select_all` RLS has no matching insert policy at all — places are seeded/business-managed (`places_update_business_staff`), not user-created, matching the spec's deferred business-account flow. `usePlaces` lists a city's places ordered by `popularity_score`; no map rendering yet (no map library installed — introducing one is a real dependency decision left for when Discovery/Stitch assets need it, not pulled in speculatively here).
- **Vibes**: `useCreateVibe` posts a mood/activity optionally tied to a place; `usePlaceVibes` reads a place's active (non-expired) vibes for its "who's here" list. Only `place_id`-scoped vibes are surfaced in Phase 5 — a city-wide or following-scoped vibes feed is Discovery (Phase 9) territory.
- **Events**: plain PostgREST queries, no RPC needed (unlike the home feed, a city-scoped event list has no following-graph filter to express). `useCreateEvent` generates a slug client-side (`lib/slugify.ts`) since `events.slug` has no DB default — mirrors the same real-vs-fabricated-uniqueness problem `handle_new_user()` solved for usernames, just client-side since events are organizer-authored through RLS rather than trigger-authored.
- **Check-ins**: `useCreateCheckIn` surfaces the DB's rate-limit trigger (`enforce_check_in_rate_limit`, `supabase/migrations/..._check_ins.sql`) as a friendly message instead of a raw Postgres exception — confirmed against a live rejection: the error body is `{"code":"P0001","message":"check_in_rate_limited"}`, matched via `CHECK_IN_RATE_LIMITED_MESSAGE` from `packages/shared`. Checking in at an event (not just a place) is handled by the same hook; the existing `sync_event_checkin` trigger moves that attendee's `event_attendees.status` to `checked_in` automatically — verified live: RSVPing "going" then checking in moved the attendee from the going bucket to checked-in in `get_event_attendee_summary`'s counts without any client-side bookkeeping.
- **`get_event_attendee_summary(event_id)`**: the one new RPC this phase needed — counts by status plus the caller's own status, `security invoker` so `event_attendees` RLS still applies underneath it (an event the caller can't see returns zero counts, not an error).

## A second NativeTabs web bug, found by actually looking at a screenshot

Clicking the new "Events" toggle on the Explore screen hung — Playwright's click reported another element "intercepts pointer events," even though the accessibility snapshot showed nothing wrong. Accessibility snapshots are text trees; they don't carry layout position, so a genuine visual bug can hide behind a perfectly reasonable-looking snapshot. Taking an actual screenshot showed why: `apps/mobile/src/components/app-tabs.web.tsx`'s floating tab-bar container (`tabListContainer`) was `position: 'absolute', width: '100%'` with **no `top`/`bottom`**. In React Native's positioning model, an absolutely positioned view with no edges set anchors to its container's origin — so the container sat pinned to the **top** of the viewport, full width, 78px tall, invisible (only its inner pill has a background), silently intercepting every click in that strip. It had been there since the Phase 1 Expo template scaffold; it just never collided with anything, because no earlier screen placed interactive elements that high up. The Explore screen's new segmented control does.

Fixed with two changes, both necessary:
1. `bottom: 0` on `tabListContainer` — anchors it where it visually renders instead of defaulting to the top.
2. `pointerEvents: 'box-none'` (as a style property, not the deprecated prop form — RN 0.86 warns on the latter) — the container itself stops absorbing clicks in its empty padding, while the pill and its children (tab links, the Docs link) keep working normally.

Same root cause category as the native-tabs web limitations already in `docs/auth.md`/`docs/feed.md` (the web shim is a dev-convenience fallback, not the shipped product surface), but this one is a straightforward CSS positioning bug rather than a router/deep-linking limitation, and it's now fixed rather than worked around.

## Verified end-to-end (local stack, real browser)

Browsed all 12 seeded Accra places; opened Cantonments Event Hall, checked in (count went 0→1), shared a "Party" vibe with text (appeared immediately under "Who's here"), saw its seeded upcoming event. Opened that event: attendee summary showed the seeded fixture (1 going, 1 interested) correctly; RSVPing "Going" updated the count live; checking in moved the attendee to "checked in" via the existing DB trigger with no app-side status logic; a second check-in within the rate-limit window was correctly rejected. Created a new event through the plain form (title/description/date/time/category/capacity) and confirmed it appeared in the city's event list, correctly ordered by start time alongside the seeded one.

## Deferred (not a gap, a scope boundary for this phase)

- No place picker in the create-event form (place-less events are valid; picking one needs a proper list/search UI).
- No map view anywhere yet — `packages/shared`'s map-provider abstraction exists for when one is wired in, but no map library is installed.
- Vibes only ever attach to a place in this phase; a standalone "post a vibe with just your location" flow is Discovery/feed-integration work, not here yet.
