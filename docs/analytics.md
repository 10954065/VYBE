# Analytics

## Where this started

`analytics_events` has existed since Phase 2 — an append-only table any client (including an anonymous one) could insert into, with no read policy — and nothing ever wrote to it. `.env.example` already listed PostHog keys for both apps, and the README named PostHog as the analytics tool, but neither app had a PostHog SDK or a single tracking call. There was also no way to see any product numbers: the admin dashboard (Phase 12) only did moderation.

## How it works

Events go to two places from one call, `track(name, properties)` in `apps/mobile/src/lib/analytics/analytics.ts`:

1. **Our own `analytics_events` table**, always. Batched in memory and inserted through the normal Supabase client, so RLS applies like anywhere else: a row's `user_id` must be the caller's own id or null.
2. **PostHog**, when `EXPO_PUBLIC_POSTHOG_API_KEY` is set (`EXPO_PUBLIC_POSTHOG_HOST` defaults to PostHog US cloud). Without a key the PostHog client is never created.

Owning the data first means the admin dashboard works today with no third-party account, and PostHog becomes a richer view on top (cohorts, paths, retention charts) as soon as someone creates a project and pastes the key in.

### The event catalog

Every event name and its exact properties live in one place: `analyticsEventSchemas` in `packages/shared/src/schemas/analytics.ts`. `track()` is typed against it — the compiler rejects an unknown event or wrong properties — and validates at runtime with the same strict Zod schemas before anything is queued.

Properties are deliberately low-cardinality and free of personal content, so the same payload can go to both destinations without a per-call privacy review:

- No post, comment, or vibe text — `post_created` records the visibility and whether it was in a crew.
- No search text — `search_performed` records only the query's length and the number of results.
- No ids of content — screen views use the route pattern (`post/[id]`), never the concrete URL.

| Event | Properties | Fired from |
|---|---|---|
| `app_opened` | — | root layout, once per launch (after the session has loaded) |
| `screen_viewed` | `screen` | root layout, on every route change |
| `signed_up` / `signed_in` | — | sign-up / sign-in hooks |
| `onboarding_completed` | `genre_count`, `neighborhood_count` | onboarding hook |
| `post_created` | `visibility`, `in_crew` | create-post hook |
| `comment_added` | `is_reply` | add-comment hook |
| `reaction_added` | `target` (`post` / `check_in`) | reaction toggles (add only) |
| `check_in_created` | `at_event` | check-in hook |
| `vibe_shared` | `vibe_type` | vibe hook |
| `event_created` / `event_rsvp` | `category` / `status` | event hooks |
| `crew_created` / `crew_joined` | `privacy` / — | crew hooks |
| `challenge_joined` | — | challenge hook |
| `user_followed` / `user_blocked` | — | follow / block toggles (add only) |
| `report_submitted` | `target_type`, `category` | report hook |
| `search_performed` | `query_length`, `result_count` | Explore search, once per settled query |
| `content_shared` | `entity`, `outcome` | share hook |
| `notification_opened` | `type` | notification list |

Every event also carries `session_id` (random, one per app launch), `platform`, and `app_version`. Mutation events fire only after the server accepted the write, so a rejected check-in (rate limit) or a failed post isn't counted.

### Delivery

- Flushed after 5 seconds, at 20 queued events, or when the app goes to the background.
- A batch rejected for a reason that will never succeed (SQLSTATE classes 22/23/42: bad data, a constraint, RLS) is dropped; anything else (network) is put back in front of the queue, which is capped at 200 events.
- **Sign-out flushes first.** A queued event carries the user's id, and RLS only accepts it while that user's session is valid — so every sign-out path (Settings, the suspended screen, account deletion) goes through `lib/auth/sign-out.ts`, which sends the queue before ending the session. Verified live: an event tracked under a second before tapping Log out landed with the user's id.
- Sign-in and sign-up attribute their own event immediately (the session listener hasn't run yet when the mutation resolves).

### Opting out

Settings has a "Share usage analytics" switch, stored on the device. Off means nothing is queued, the existing queue is dropped, and PostHog is opted out too. Events tracked at launch before the stored preference has loaded are held until it has, and never sent if it turns out to be off.

## Guarding the table

Because anyone can insert, `20261013000000_analytics.sql` makes Postgres reject anything malformed rather than trusting the client's validation:

- `event_name` must match `^[a-z][a-z0-9_]{2,63}$`;
- `properties` must be a JSON object of at most 4 KB;
- `created_at` is always set by the server (a trigger overrides whatever the client sends), so events can't be backdated or future-dated to skew daily numbers.

Verified directly as the `anon` role: anonymous inserts with no user succeed; claiming someone else's `user_id` fails RLS; a bad name, an array, and an oversized payload each fail their constraint; a backdated insert is stamped `now()`; and `anon` reads back zero rows.

## The admin page

`/admin/analytics` (new nav item), over the last 7, 30, or 90 days:

- **Totals**: active users, sessions, sign-ups, onboarding completions, posts, check-ins, reactions, comments, events and crews created.
- **Daily activity**: active users, sign-ups, posts, check-ins per day.
- **New-user activation**: of the people who signed up in the period — how many finished onboarding, posted/checked in/commented, and came back on a later day.
- **Top screens** and **top actions**, with distinct-user counts.

It's one SQL function, `get_analytics_overview(p_days)`. Content numbers (sign-ups, posts, check-ins…) are counted from the real tables, not from client events, so a client that drops or forges events can't skew them; `analytics_events` is used only for what only the client knows (who was active, sessions, which screens). The function is `SECURITY INVOKER` with `EXECUTE` granted to `service_role` only — `authenticated` and `anon` get "permission denied" (verified) — and the page calls it through the admin client after the same `requireAdmin()` gate as the rest of the dashboard.

## Verified

Live, with the app on Expo web and a stand-in PostHog endpoint (a local HTTP server, since there's no PostHog project) pointed at by `EXPO_PUBLIC_POSTHOG_HOST`:

- Signing in as the demo user, browsing Explore, searching "labadi", opening a place, sharing it, going Home and liking a post produced exactly those events in `analytics_events`, in order: anonymous before sign-in, then with the user's id and city; screens as `explore`, `place/[id]`, `home`; the search as `{query_length: 6, result_count: 2}`; a page reload got a new `session_id`.
- The same events reached the PostHog stand-in in batches (`$screen` for screen views), and the distinct id switched from an anonymous id to the user's id via `$identify` at sign-in.
- Turning the switch off, then navigating, recorded nothing in either destination; turning it back on resumed.
- Events also arrived from a real iPhone running the app in Expo Go (`platform: ios`) over the LAN.
- The admin page showed the real numbers (e.g. 4 sign-ups, 7 posts, 9 reactions — 5 seeded, 3 made on the iPhone, 1 in this test).

## Not built

- **A real PostHog project.** Needs an account; set `EXPO_PUBLIC_POSTHOG_API_KEY` (and `EXPO_PUBLIC_POSTHOG_HOST` for EU cloud) to turn it on. Same shape of gap as the EAS project id.
- **Rate limiting inserts.** The table is guarded against malformed rows, but nothing stops a client from inserting many well-formed ones; that belongs with Phase 14's broader rate-limiting pass.
- **Retention/cleanup.** Events are kept indefinitely; a `pg_cron` purge (e.g. older than 13 months) is a one-liner once there's a policy for it.
- **Offline persistence.** The queue lives in memory: events tracked right before the OS kills a backgrounded app can be lost. Acceptable for product analytics.
- **Web app analytics.** `apps/web` is only the admin dashboard; tracking admins isn't useful, so the unused `NEXT_PUBLIC_POSTHOG_*` keys were removed from `.env.example`.
