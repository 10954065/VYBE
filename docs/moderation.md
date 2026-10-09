# Moderation & safety

## Where this started

`reports` and `blocks` have existed since Phase 2, schema-complete, with zero consumers — no Zod schema, no feature folder, no UI, same shape of gap notifications/notification_preferences were in before Phase 8. One thing was already real, though: `is_content_visible_to()` (the single visibility gate shared by posts/vibes/events/check_ins) already checked `blocks` bidirectionally and said so in its own comment — "blocks always win." That meant actual content was already protected. Nothing else was.

## What "blocks always win" turned out not to cover

Before writing any client code, every place a block *should* matter but didn't was checked directly against the schema, not assumed:

- **`profiles` itself had no block-awareness.** `profiles_select_visible` was `deleted_at is null or id = auth.uid()` — a blocked person's profile (username, display name, avatar, bio) was still fully readable by direct id, by search, by anything. Blocking someone hid their *posts*, not *them*.
- **`are_friends()`, `get_home_feed`, `get_suggested_people`, `search_people`, and all three `get_recommended_*` RPCs never referenced `blocks`.** `get_home_feed` turned out to be incidentally safe — it selects from `posts`, which is still RLS-protected by `is_content_visible_to` regardless of the function's own filter logic. `search_people` and `get_suggested_people` were not: both query `profiles` directly, with nothing blocking a blocked person from surfacing there.
- **You could still follow someone who'd blocked you, or who you'd blocked.** `follows_insert_self` only checked `follower_id = auth.uid()`.
- **Blocking didn't unfollow.** A pre-existing mutual follow (and therefore `are_friends()` returning true, and therefore every friend-signal recommendation) could survive a block indefinitely.
- **`reactions_insert_self` had no visibility gate at all** — unlike `comments_insert_self`, which already required `is_content_visible_to` on the target post. Anyone could insert a reaction against any post, comment, or check-in regardless of visibility or blocks; the row would just be invisible to them afterward (per `reactions_select_visible`) while still inflating the count everyone else sees. Not a blocking-specific bug, but exactly the kind of gap a "safety" pass exists to catch — a stranger, or someone blocked, could silently pad engagement numbers on content they were never allowed to see.

`20261011000000_moderation_engine.sql` fixes all of it from one shared helper, `are_blocked(a, b)` (extracted from `is_content_visible_to`'s own inline check, `security definer` for the same reason that function already is — `blocks_select_own` only lets you read blocks where *you're* the blocker, so an invoker-rights query from the blocked side would silently see nothing): `is_content_visible_to` and `are_friends` now call it; `profiles_select_visible` and `follows_insert_self` now enforce it; a new `unfollow_on_block` trigger deletes any surviving follow row in both directions the moment a block is inserted; `search_people`/`get_suggested_people` exclude it explicitly (on top of inheriting it from the `profiles` RLS fix, for legibility); and `reactions_insert_self` was rewritten to mirror `reactions_select_visible`'s own three-way post/comment/check-in visibility check, closing the reaction gap independent of blocking.

`get_recommended_places`/`get_recommended_events`/`get_recommended_crews` and `get_social_proof` needed no direct edit — all four already rank by `are_friends()` as a function call, not an inlined copy of its SQL, so fixing it once propagated everywhere for free. Checked, not assumed.

## The one deliberately asymmetric piece

Profile visibility is symmetric — if A blocks B, neither can see the other's profile through the general `profiles_select_visible` policy. But the person who did the blocking still needs to see who they blocked, for their own blocked-users list. `get_my_blocks()` is a narrow, `security definer` escape hatch for exactly that: it joins `blocks` to `profiles` and returns results scoped to `blocker_id = auth.uid()` only, so it can never be used to look up anyone except people the caller themselves blocked. Verified directly: after a block, the blocked party querying the blocker's profile gets zero rows; the blocker querying the blocked party's profile *also* gets zero rows through the general policy, but `get_my_blocks()` still returns it.

## Client surfaces

- **Block / Unblock / Report** on the public profile screen (`/profile/[id]`). Blocked state replaces Follow + Share with a single "Unblock" button; unblocked state shows Follow + Share plus a secondary Report/Block row.
- **Report** on post, comment (per-row on the post detail screen), place, event, and crew — one reusable `ReportButton` component (a small modal: category grid from the real `reports.category` check constraint, optional free-text details, submit), not five hand-rolled copies. `business` has no detail screen yet in this app, so it's excluded from this pass — not a schema gap, just nothing to attach the button to.
- **Blocked users** settings screen (`/profile/blocked-users`, linked from Settings) backed by `get_my_blocks()`, with an Unblock action per row.
- `use-toggle-block.ts` mirrors `use-toggle-follow.ts`'s mutation shape but invalidates more broadly — a block can silently remove a follow server-side (the new trigger) and affects search/suggestions/feed, not just the one relationship, so it invalidates all of those alongside the narrower follow-toggle set.

## A bug the new Block confirmation exposed, not caused

Clicking "Block" the first time did nothing visible at all — no dialog, no error, no network call. `Alert.alert`'s React Native Web implementation is `static alert() {}`, a complete no-op (checked by reading the library source, not guessed). Every existing `Alert.alert` confirmation in this app — delete account, check-in errors, RSVP errors, leave-crew — has silently done nothing on web since whichever phase introduced it. That's a real, pre-existing, systemic gap, and fixing every call site is out of scope here. What's in scope is not shipping *this phase's* new destructive confirmation broken: `apps/mobile/src/lib/confirm.ts`'s `confirmDestructive()` uses `window.confirm` on web and falls back to the real `Alert.alert` on native, and the Block flow was re-verified live afterward — the browser's native confirm dialog appeared with the right message, accepting it executed the block, and the UI updated immediately (follower/following counts dropped to 0 as the auto-unfollow trigger fired).

## What's not here

No moderator role, no review queue, no way for anyone to act on a submitted report beyond `resolved_by`/`resolved_at` columns that nothing writes to yet. That's deliberate — `reports`' own RLS was already designed service-role-only for resolution, and a review surface is Phase 12's job (Admin dashboard), not this one's. Reports are real and stored; nothing reads them back yet except the reporter's own `pending` status.

## Verified

Backend, directly against Postgres with three real test users before any client code existed: a one-way follower blocked by the person they followed loses the follow (both directions, confirmed by row count), `are_friends()` flips to false, `is_content_visible_to` hides even an `everyone`-visibility post from the blocked party, `profiles_select_visible` hides the blocker's profile from the blocked party *and* the blocked party's profile from the blocker (symmetric), `get_my_blocks()` still returns it for the blocker specifically, re-following is rejected by RLS, `search_people` returns zero results for a blocked target, a blocked person's reaction-insert on the blocker's post is rejected, and a stranger's reaction-insert on an `only_me` post is rejected while the same insert on an `everyone` post succeeds.

Client, end-to-end in a real browser against the live local stack: Report submitted from a profile (with category + free-text details) landed in `reports` with the right reporter/target/category; Report submitted from a place landed with `target_type = 'place'`; Report buttons confirmed rendering correctly in their own distinct context on the post detail screen and on an individual comment row. Block from a profile immediately flipped the UI to the blocked state and visibly zeroed both follower/following counts; the blocked-users screen showed the real blocked profile via `get_my_blocks()`; unblocking from that screen removed it from the list and confirmed in the database, and a follow-up `search_people` call for the same viewer showed the previously-blocked person reappear.
