# Database Schema

Implemented in `supabase/migrations/`. 15 migrations, applied in order, each a complete vertical slice (table + indexes + triggers + RLS) rather than schema-then-policies-later.

## Migration order (and why)

```
extensions_and_helpers  -- set_updated_at() trigger fn, is_content_visible_to() visibility fn
cities
profiles                -- + user_interests, auth.users -> profiles trigger
follows
crews                   -- + crew_members (moved early: posts/vibes/events reference crew_id)
businesses              -- + business_staff (moved early: places/events reference business_id)
places
posts                   -- + post_media, comments, reactions, saved_posts
vibes
events                  -- + event_attendees
check_ins
gamification            -- xp_transactions, streaks, badges, user_badges, challenges, challenge_participants
notifications           -- + notification_preferences
moderation              -- reports, blocks
analytics
feed                    -- get_home_feed(), get_suggested_people() — RPCs, no new tables
```

`crews`, `businesses` and `places` run before `posts`/`vibes`/`events` specifically so those tables' `crew_id`/`business_id`/`place_id` columns can be real foreign keys from the start — no deferred `ALTER TABLE ... ADD CONSTRAINT` once a dependency finally exists.

## Deliberate deviations from the original table list

- **No separate `crew_posts` table.** A crew post is just a row in `posts` with `crew_id` set and `visibility = 'crew'`. A second posts-shaped table for crew content would duplicate the post/comment/reaction logic that already exists — exactly the kind of duplication the project's own coding standards rule out. Documenting the call here per that same standard.
- **No `users` table.** `auth.users` (Supabase Auth) is the identity table; `public.profiles` is the 1:1 public-facing row, created automatically by a trigger on signup (`handle_new_user()`).
- **Event/check-in/vibe posts are not posts.** The home feed built in Phase 4 (`get_home_feed`, see below) only surfaces `posts` so far; aggregating `vibes`/`check_ins`/event highlights into it is Phase 5+ work, done at the query layer rather than by cramming every content type into one polymorphic table.

## Conventions actually applied

- `gen_random_uuid()` (built into Postgres 13+ core) for UUID PKs; `analytics_events` uses a `bigint identity` instead since it's high-volume and never an FK target.
- `created_at`/`updated_at` via a shared `set_updated_at()` trigger; `deleted_at` soft-delete on content that needs a moderation trail (`profiles`, `posts`, `comments`, `crews`, `businesses`, `places`, `events`). `check_ins`, `vibes`, `xp_transactions` are immutable/ephemeral by design — no soft delete, no update path for most fields.
- **Every table has RLS enabled.** A table with no matching policy for an operation denies it by default — several tables (e.g. `xp_transactions`, `streaks`, `badges`, `notifications`, `challenges`) intentionally have no client-facing INSERT/UPDATE policy at all, because that data must only ever be written by server-side (service-role) code in response to a verified action. This is what makes "XP transactions are auditable" and "challenges can't be self-completed" actually true, not just documented intent.
- **One shared visibility function**, `is_content_visible_to(viewer, owner, visibility, crew_id)`, used by `posts`, `vibes`, `events` and `check_ins` RLS policies. Visibility enum is consistent everywhere: `everyone | followers | friends | crew | only_me`. Blocks (either direction) always hide content, checked inside this function.
- **Check-ins are rate-limited server-side**: a `BEFORE INSERT` trigger rejects a check-in within 120 seconds of the user's previous one (mirrors `CHECK_IN_RATE_LIMIT_SECONDS` in `packages/shared`).
- **Check-ins drive event attendance**, not the other way around: checking in against an event upserts that user's `event_attendees.status` to `checked_in` via trigger; clients can only ever set `interested | going | cancelled` themselves.
- **Crew membership approval is server-authoritative**: a trigger sets `crew_members.status` based on the crew's `privacy`, overriding whatever the insert claims — a private crew cannot be joined by just inserting `status = 'approved'`.
- **Current XP is derived, not stored**: `user_xp_totals` is a view summing `xp_transactions`, not a column that could drift from its ledger.
- Precise `lat`/`lng` on `vibes`/`check_ins` is user location data and stays private by default (no public SELECT policy exposes it beyond the owner and whoever the visibility rules admit); `places` coordinates are intentionally public — they're business/venue listings, not personal location data.
- Every profile-referencing (and crew-/business-referencing) foreign key has an explicit `ON DELETE` action — `cascade` or `set null`, deliberately chosen per table, never the Postgres default of blocking the delete. Verified by actually deleting a user wired into every table in the graph (see the `fix(db)` commit) rather than just reading the FK clauses.
- **`get_home_feed`/`get_suggested_people` are plain SQL functions, not SECURITY DEFINER.** Both read `auth.uid()` internally rather than accepting a viewer id as a parameter (a client-supplied user id is never trusted, per `docs/architecture.md`), and both run as the calling role (the explicit, if default, `security invoker`) so the underlying `posts`/`profiles` RLS policies still apply on top of whatever these functions filter — a bug in either can only narrow what comes back, never widen it past what RLS already allows. Feed pagination is keyset-based (`(created_at, id) < (cursor_created_at, cursor_id)`), not `OFFSET`, so it stays correct while new posts are being inserted mid-scroll.

## Generated types

`packages/shared/src/database.types.ts` is generated from the live schema via `npm run db:types --workspace=@vybe/shared` (needs `supabase start` running locally) — never hand-edited. `createSupabaseClient` (packages/shared) and the web `@supabase/ssr` clients are both typed with it, so `.from("posts")` etc. is checked against the actual columns, not `any`. Regenerate after every migration that changes the schema.

## Seed data

`supabase/seed.sql`: the 6 cities (Accra launched, the rest flagged `is_launched = false`), the badge catalog, ~12 fictional Accra places across categories, and 3 starter challenges. Deliberately does **not** seed fake `auth.users` rows via raw SQL — that schema is Supabase-version-sensitive and fragile to hand-craft. Demo user accounts come from `apps/web/scripts/seed-dev-users.ts` instead (`npm run db:seed-users` from `apps/web`), which goes through the real Auth Admin API — tested against a local stack, including idempotency (re-running skips existing accounts) and confirming the `handle_new_user`/`handle_new_profile_preferences` triggers fire correctly for real signups.

## Testing this locally

```bash
npx supabase start   # requires Docker
npx supabase db reset  # drop, recreate, apply all migrations + seed.sql
npm run db:seed-users --workspace=@vybe/web   # demo auth users (needs apps/web/.env.local)
npx supabase stop
```
