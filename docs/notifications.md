# Notifications: in-app and push

## Where this came from

`notifications` and `notification_preferences` have existed since Phase 2 with nothing ever writing to them — no Stitch screen assumes this layer either, so unlike the Home/Discover/Crews/Profile pass (`docs/gamification.md`), this one has no design to reskin. It's new ground: a real engine reacting to every write-path this project already has (follows, reactions, comments, crew membership, XP, streaks, badges, challenges), plus real push delivery.

## The engine

`supabase/migrations/20261008000900_notifications_engine.sql` adds the triggers. One internal primitive, `create_notification(user_id, actor_id, type, target_type, target_id, body)`, is the single write path for every notification in the app — it skips self-notifications (reacting to your own post doesn't notify you), checks the right `notification_preferences` column for the type, inserts the row, then best-effort pushes. Not a public RPC — same posture as `award_xp`/`touch_outside_streak`/`evaluate_badges` in the gamification engine: `revoke execute ... from public, anon, authenticated`.

| Trigger | Fires on | Notifies |
|---|---|---|
| `handle_follow_notification` | `follows` insert | the person followed |
| `handle_reaction_notification` | `reactions` insert | the post/comment/check-in owner (never the reactor themself) |
| `handle_comment_notification` | `comments` insert | the post's author |
| `handle_crew_join_request_notification` | `crew_members` insert, `status = 'pending'` | every admin/owner of the crew |
| `handle_crew_join_decision_notification` | `crew_members` update, pending → approved | the requester |
| `handle_crew_join_rejected_notification` | `crew_members` delete of a still-pending row | the requester — guarded against the requester cancelling their own request (same DELETE shape, different actor, checked via `auth.uid()`) |
| `handle_challenge_completed_notification` | `xp_transactions` insert, `reason = 'complete_challenge'` | the challenge's completer, with the real challenge title |
| `handle_xp_level_up_notification` | `xp_transactions` insert | whoever just crossed a level boundary — computed by diffing `level_for_xp(total before this row)` against `level_for_xp(total after)`, not a flat XP-amount check |
| `handle_streak_milestone_notification` | `streaks` update, `current_count` increased | whoever just crossed 3/7/14/30/60/100 days |
| `handle_badge_earned_notification` | `user_badges` insert | whoever just earned it, with the real badge name |

`level_for_xp(total_xp)` is a pure SQL port of `packages/shared`'s `levelForXp` — it must stay in sync with that file's `50*i*(i+1)` curve.

Two notification `type`s this pass added to the original Phase 2 enum (`badge_earned`, and the `xp_milestones`/`badges` preference columns) didn't exist as concepts when that constraint was written. `recommendation` is still unused — that's Phase 9 (Discovery) territory, same "schema exists, nothing writes it yet" honesty as the streak types this project doesn't compute.

## Event reminders: the one notification that needs a clock

Every trigger above reacts to a real write. `event_reminder` doesn't — it reacts to time passing, which nothing in this project had needed before. `supabase/migrations/20261008001000_event_reminders.sql` adds `pg_cron` and schedules `send_event_reminders()` every 10 minutes: it finds everyone `interested` or `going` to an event starting within the next hour who hasn't already been reminded about it, and reminds them once. The "already reminded" check has no time bound (an event only starts once), so re-running the job is naturally idempotent — verified directly: calling it twice in a row produces exactly one notification, not two.

## Push, for real

`push_tokens` (`20261008000800_push_tokens.sql`) stores one row per device. `send_push_notification` (an internal primitive, same revoke posture as the rest) calls Expo's push API directly from inside the trigger via `pg_net` — `net.http_post`, async and fire-and-forget, the same "stay inside Postgres" posture as every other side effect in this project. No edge function, no external worker.

This was verified against the real Expo push endpoint, not mocked: registering a token and triggering a notification enqueued a real `net.http_post` to `https://exp.host/--/api/v2/push/send`, which returned a real HTTP 200 with Expo's own validation error for the fake test token (`"ExponentPushToken[test-token-alice]" is not a valid Expo push token`) — proof the whole pipeline reaches Expo's actual service, not just that a row landed in a queue table.

**What doesn't work yet, and why**: minting a real push token on a device needs an EAS project id (`Constants.expoConfig.extra.eas.projectId`), which this app doesn't have — no `eas init` has been run, and that creates a cloud-side project tied to a real Expo account, not something to set up unilaterally. `apps/mobile/src/features/notifications/use-push-registration.ts` checks for that id and is a documented no-op without it: permissions are never requested, no token is minted, the rest of the app behaves identically. The backend side is fully real and activates the moment a project id exists — same shape of gap as `docs/gamification.md`'s ticket pricing (real column, not wired to the thing that needs an external account).

## Client

- `features/notifications/` — `useNotifications` (last 50, actor profile embedded via `profiles!notifications_actor_id_fkey` since `notifications` has two FKs into `profiles`), `useUnreadNotificationCount`, `useMarkNotificationRead`/`useMarkAllNotificationsRead`, `useNotificationPreferences`/`useUpdateNotificationPreferences`, `useRegisterPushToken`, `usePushRegistration`.
- A bell icon on Home (the only screen that gets one — Stitch's nav has no 5th tab for this, so it's a header affordance rather than a tab) shows the real unread count and opens `/notifications`, a flat list that marks a row read on tap and navigates to `/post/[id]`, `/crew/[id]`, or `/event/[id]` when the target resolves to a real screen — this project has no detail route for a lone comment, a check-in, another user's profile, a badge, or a challenge, so those types are informational-only, same "don't fabricate navigation to a screen that doesn't exist" rule as everywhere else.
- `/profile/notification-preferences` (linked from Settings) exposes every real toggle: push on/off plus one switch per in-app category.

## Verified

Every trigger in this pass was exercised directly against a live local Postgres instance first (follow, self-reaction skipped, reaction from someone else, comment, preference gating, crew join request/approval/rejection with the correct actor, badge earned, a level-up crossing exactly at the 50·1·2=100 XP boundary, challenge completion with the real title, a streak crossing 3 days, push enqueueing a real Expo API call, and the event-reminder cron job firing once and not twice). Then end-to-end through the real browser with three seeded users: the bell's live unread badge, the full notification list with real icons/actors/bodies, mark-one and mark-all-read (both confirmed against the database, not just the UI), preference toggles persisting, tap-to-navigate landing on the right real screen, and a genuine UI action — clicking "Follow" — producing a real notification for the followed user, not a simulated one.
