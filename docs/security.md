# Security

Phase 14's security pass. It started from two sources: `supabase db advisors` (Supabase's own security and performance linter), and attempts to break the rules directly through the API with real accounts, the way an attacker with the public key and their own login would. Every hole below was reproduced that way before it was fixed, and each one has a regression test.

## Holes found and closed

| What an attacker could do | Why | Fix |
|---|---|---|
| **A suspended user un-suspends themselves** — `PATCH /profiles` with `suspended_at: null`. Introduced in Phase 12. | RLS chooses rows, not columns; the owner could write every column of their profile. | Column-level grants: `authenticated` may update only the profile fields the app edits. |
| **Join any crew — private ones included — as its owner.** | `role` was client-settable on insert, and `set_crew_member_status` only holds plain `member`s for approval, so `role: 'owner'` was auto-approved. | `crew_members` accepts only `crew_id, user_id` on insert, and only `role, status` on update. |
| **Move your membership into someone else's crew as owner.** A crew admin updated their own row's `crew_id`. | `crew_members_update_admins` had `WITH CHECK (true)`. | The new row must satisfy the same admin rule, and `owner` can't be granted through the API. |
| **File a report that's already `dismissed`**, so moderators never see it. | Report status was client-settable on insert. | `reports` accepts only the five columns the app sends. |
| **RSVP as already `checked_in`** for event-attendance XP without checking in. | The UPDATE policy limited statuses; the INSERT policy didn't. | Same status rule on insert. |
| **Backdate rows** (e.g. a check-in an hour in the past) to dodge the 120-second check-in limit or fake streak days. | `created_at` was client-settable. | A trigger stamps `created_at = now()` on every user-created table. |
| **Fake counters and flags**: a crew with `member_count: 5000`, a business created `verified`, a place's `popularity_score`. | Same column problem, on insert and update. | Column-level grants on `crews`, `businesses`, `places`, `notifications` (only `read_at`). |
| **Keep posting while suspended** with a still-valid token (the gap Phase 12 left open). | Suspension only hid content. | `RESTRICTIVE` insert/update policies on every content table; reads still work so the app can show the suspended screen. |

Also from the advisor:

- `WITH CHECK (true)` on `crews`, `businesses` and `places` updates (same shape as the crew-members hijack) now repeat their `USING` rule.
- Two views (`user_xp_totals`, `place_rating_aggregates`) ran as their owner and bypassed RLS; now `security_invoker`. Both read already-public tables, so results are unchanged.
- Three functions had a mutable `search_path`; now pinned.

### A real bug found along the way: push notifications after switching accounts

`push_tokens_claim` (`UPDATE ... USING (true)`) was meant to move a phone's push token to whoever signs in next on it (Phase 8). It never worked: an upsert that lands on an existing row must also pass that row's SELECT policy, which only shows users their own tokens. The second account on a phone got an RLS error and never received pushes. Replaced with a `register_push_token()` function that reassigns the token to the caller (and validates its format, and refuses suspended accounts), and the always-true policy is gone.

## Rate limits

Same mechanism as the existing check-in limit — a `BEFORE INSERT` trigger counting the actor's recent rows — now shared by one function, `enforce_insert_rate_limit(actor_column, window, max)`:

| Table | Limit |
|---|---|
| `posts` | 10 per 5 minutes |
| `comments` | 15 per minute |
| `reports` | 20 per hour |
| `analytics_events` (signed in) | 500 per 5 minutes |
| `check_ins` (existing) | 1 per 120 seconds |
| Photo uploads, `post-media` (Phase 15) | 40 per 5 minutes |

The app shows a plain-language message when a limit is hit, and the analytics tracker drops (rather than retries) a rate-limited batch. Anonymous analytics have no user to limit by; that needs IP-level limiting at the edge, which belongs with deployment (Phase 18).

## Tests

`supabase/tests/database/*.test.sql` — pgTAP, run with `npx supabase test db` against the local stack. Each file runs in a transaction that's rolled back, creates its own users, and acts as them through the same RLS the app uses:

- `010_privilege_escalation` — every attack above stays closed, and the legitimate version of each action still works.
- `020_suspension_and_rate_limits` — suspended users can't write but can read their own profile; reinstated users can; timestamps are server-stamped; each limit holds.
- `030_visibility` — privacy levels, blocking, suspended users' content, and analytics privacy (Phases 4, 11, 12, 13).
- `040_push_tokens` — the account-switch claim works and nothing else can reassign or read tokens.
- `050_photo_posts` (Phase 15) — photo uploads, attachment and reading follow the post's audience; nobody can attach, plant or read someone else's photos.

Separately, every write the mobile app makes was replayed through the API with the exact payloads its hooks send (25 actions, from onboarding to crew approval to analytics), to confirm the tighter permissions broke none of them.

## Advisor status

After the three Phase 14 migrations, `supabase db advisors --level warn` reports only:

- **`extension_in_public`** for `pg_trgm` and `pg_net` — accepted. Moving `pg_trgm` means recreating every trigram index and the search functions that use its operators; `pg_net` is managed by Supabase. Neither exposes data.

`unused_index` notices are informational and based on local traffic only.

The same holds on a brand-new database built from all migrations plus the seed (checked by replaying them into a throwaway Postgres, as the CI database job does).

## Web app headers

`apps/web/next.config.ts` sends, on every response: a Content-Security-Policy of `frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` turning off camera, microphone, geolocation and payment, and HSTS (ignored over plain http locally, enforced once deployed). `X-Powered-By` is off. Verified: the admin sign-in, pages, and Server Actions (suspend / lift suspension) all still work under `form-action 'self'`.

## Photos (Phase 15)

Post photos live in a private Storage bucket and are read through short-lived signed links that Storage only issues to people allowed to see the post. See `docs/feed.md` for the rules, including the one that stops a photo being re-attached to a post with a wider audience.

A security review of the change (with live attempts against the local Storage API: other audiences, blocked and signed-out readers, soft-deleted posts, path traversal, oversized and wrong-type files, re-attaching or overwriting someone else's photo) found no way to read or plant a photo. It found one real gap, now closed: uploads go straight to the Storage API, so none of the table rate limits applied, and one account could upload without limit and never post. Each bucket's upload rule now calls `check_upload_rate` (40 photo-post uploads per 5 minutes). Storage reports a refusal as a generic `database error, code: P0001`, which the app translates.

Two smaller findings are open:

- **Uploads that never get attached** (the app deletes them when a post fails, but a direct API caller needn't) are never swept. Deleting a file needs the Storage API, not SQL, so this belongs with the scheduled cleanup job snaps need (Phase 17).
- **File contents aren't checked against the declared type.** A text file uploaded as `image/jpeg` is accepted and served back as `image/jpeg`. Images are only ever displayed as images, where embedded script doesn't run, so this is low risk; checking magic bytes would need server-side processing of every upload.

**Account deletion now removes uploads.** Deleting an account cascades through every table, but Storage has no foreign key to users, so a deleted account's photos used to stay in the bucket. `/api/account/delete` now deletes the user's files from every bucket in `USER_UPLOAD_BUCKETS` first (and leaves the account intact, for a retry, if that fails). Verified: a throwaway account with two photos deleted through the real route left zero files behind.

## Still open

- **A `script-src` CSP.** Restricting scripts needs a per-request nonce injected by middleware, which also makes every page dynamic — a deployment decision for Phase 18, not a header to bolt on now.
- **Rate limiting anonymous traffic.** Per-user limits can't apply to requests with no user (anonymous analytics, sign-up attempts). That needs IP-based limiting at the edge (Phase 18).
- **`extension_in_public`**, accepted as above.
