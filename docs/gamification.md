# Gamification, presence, ratings, and challenges

## Where this came from

Picking up the remaining Stitch screens (Home, Discover, Crews, Profile) meant confronting the same gap onboarding did: the designs assume a retention loop (XP, levels, streaks, badges), a social layer (friends, "outside now" presence), and data (ratings, a city leaderboard, quests) that either had schema but no engine, or didn't exist at all. Asked directly, the call was to build the real thing rather than reskin around invented numbers — this doc covers what that turned into.

## The gamification engine (Phase 7, pulled forward)

`xp_transactions`, `streaks`, `badges`, `challenges` have existed since Phase 2. Before this pass, the only writer was onboarding's one-time `complete_onboarding` RPC. `supabase/migrations/20261008000100_gamification_engine.sql` adds real triggers:

- **XP**: 10 for a check-in, +20 more the first time you check into a *specific* place (`explore_new_place`), 5 for a post, 15 for a crew join (guarded against leave/rejoin farming), 25 for RSVPing going/checked-in to an event (guarded the same way), 2 to whoever's post or check-in got reacted to (never to yourself, no claw-back on unreact).
- **Streaks**: a real day-over-day `outside` streak, computed from check-in dates (same day = no change, consecutive day = +1, gap = reset to 1). Only `outside` is wired — `social`/`explorer`/`event` streak types exist in the schema with no trigger yet.
- **Badges**: all 7 `BADGE_SLUGS` evaluated against real counts after every relevant action — first check-in, 10 distinct places, first post, 4 weekend check-ins, a created crew reaching 5 members, 5 distinct events, first-500 signup rank. The Stitch export's flavor-text badges ("Accra Foodie", "Amapiano Head") had no generalizable rule behind them and were dropped rather than faked.
- **Levels**: `levelForXp()`/`getLevelProgress()` in `packages/shared`, a quadratic curve (`50*i*(i+1)`) generated out to 100 levels instead of the original hand-picked 11-entry array, which hard-capped real users at "Lvl 11" forever.

Internal primitives (`award_xp`, `touch_outside_streak`, `evaluate_badges`) are `revoke execute`'d from `anon`/`authenticated` — Postgres already blocks calling a `returns trigger` function directly, but these three are plain functions and would otherwise be exposed as PostgREST RPCs, letting a client self-award arbitrary XP. Verified directly: an authenticated session calling `award_xp` gets `permission denied for function award_xp`.

## Friends and presence

Neither needed new state:

- **"Friend"** is exactly the mutual-follow case `is_content_visible_to()` already used for `'friends'` visibility — `are_friends(a, b)` in `20261008000200_social_graph_and_presence.sql` is that same check, factored out. `get_social_proof(viewer, target)` adds "N mutuals" (shared friends) for cards where you're not already mutual.
- **"Outside now"** is derived from real check-in recency (`PRESENCE_WINDOW_HOURS = 4`), not device location tracking — `expo-location` is used exactly once in the app (Discover's "Nearby" sort and distance chips), and is unrelated to presence. `is_outside_now()` is `security invoker`, so it only reports presence the caller's own `check_ins` RLS would already let them see; the aggregate counts (`get_city_outside_count`, `get_crew_outside_count`) are `security definer` but identity-free — a count alone doesn't leak who.

## Ratings, the busiest-place banner, and a leaderboard

- `place_ratings` (`20261008000300_place_ratings.sql`) requires a real check-in at that place first — you can't review somewhere you've never been. `place_rating_aggregates` is a derived view, same pattern as `user_xp_totals`.
- Discover's "busiest right now" banner (`get_busiest_place_now`) shows the real place with the most recent check-ins citywide. No fabricated multiplier ("3.4x average") — there's no historical baseline to compute one from.
- The Crews hub's City Board (`get_city_leaderboard`) ranks profiles by real total XP. Public data, same posture as `follows` or `crews.member_count`.

## Challenges: from static seed rows to a real quest

`challenges`/`challenge_participants` had three seed rows since Phase 2 (`supabase/seed.sql`) that never completed — no progress engine existed. `20261008000500_home_and_crews_hub.sql` activates all three challenge `type`s with real progress triggers:

| type | progress source | requirements/progress key |
|---|---|---|
| `visit_places` | distinct places checked into during the challenge window | `distinct_places` |
| `attend_event` | distinct events gone/checked-in to | `count` |
| `join_crew` | distinct crews approved-joined | `count` |

Joining awards `join_challenge` (+5 XP); hitting the target completes it and pays `challenges.xp_reward` (not the flat `complete_challenge` constant — each challenge sets its own reward, matching Stitch's "+500 XP" quest, seeded in `supabase/seed.sql` as "48-Hour Accra Explorer Challenge").

## Display-only event pricing

`events.price_label` (`20261008000400_event_price_label.sql`) is free-text an organizer can set ("Free", "GH₵150"), shown as-is on event cards. It is explicitly **not** wired to any payment or ticketing system — real payments need a provider account (Paystack/MoMo), real credentials, and business decisions (refund policy, who holds the money) that weren't this pass's to make. RSVP stays the real, free `event_attendees` flow it already was.

## Verified

Every RPC and trigger in this pass was exercised directly against a live local Postgres instance before any client code was written — see the migration files' own comments for the specific scenarios (first vs. repeat check-in, self-reaction vs. others', rate-limit interaction, RLS rejection for an unvisited place's rating, full challenge join → progress → completion → payout cycle). Then end-to-end through the real UI with two seeded users (mutual follows, a crew, an event, ratings): Home's presence strip, gamification card, and highlight events; Discover's ratings, sort chips, and busiest-place banner; the Crews hub's quest banner, crew list, and leaderboard; Profile's stats, trophy case, tabs, and the Edit screen's pre-filled real values.
