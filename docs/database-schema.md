# Database Schema (planned — Phase 2)

Not yet implemented. This is the planned table list and key relationships for the next phase, so the API/mobile work in later phases has a stable contract to build against.

## Core tables

`cities`, `users`, `profiles`, `user_interests`, `follows`, `posts`, `post_media`, `comments`, `reactions`, `saved_posts`, `vibes`, `places`, `events`, `event_attendees`, `check_ins`, `crews`, `crew_members`, `crew_posts`, `challenges`, `challenge_participants`, `xp_transactions`, `streaks`, `badges`, `user_badges`, `notifications`, `notification_preferences`, `businesses`, `business_staff`, `reports`, `blocks`, `analytics_events`.

## Conventions (to apply once migrations start)

- UUID primary keys.
- `created_at` / `updated_at` on every table; soft-delete (`deleted_at`) where content can be removed without losing moderation history.
- Row Level Security enabled on every table from its first migration.
- XP is never written directly to a user row — only ever inserted as a row in `xp_transactions`; current XP is derived.
- Location columns store precise coordinates only where the owning user explicitly opted in to sharing; public-facing reads go through an approximate-location transform (see `packages/shared/src/map/provider.ts`).
