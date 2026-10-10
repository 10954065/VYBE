# Admin dashboard

## Where this started

Phase 11 shipped reporting and deliberately stopped there: `reports`' own RLS only ever let a reporter insert and read their own rows, with a comment saying resolution was "service-role (admin) only." Nothing could review a report, and nothing could act on one. This phase builds that, as the first real code in `apps/web` beyond account deletion.

What research found before building, verified by reading the code rather than assumed:

- `apps/web` was still the create-next-app starter. Real pieces: `middleware.ts` (session refresh, no gating), `api/account/delete` (verify the caller with an anon client, *then* use the service-role client), and `lib/supabase/admin.ts`, already commented "for trusted server-side operations only — … resolving reports, admin endpoints." No sign-in page, no UI library, Tailwind v4 defaults.
- **There is no admin role anywhere.** No `is_admin`/`role` on `profiles`, no moderators table; the only "admin" concepts are per-crew and per-business.
- **There was no ban or suspend mechanism.** Account deletion is a hard delete through `auth.admin.deleteUser`.
- Posts, comments, places, events, and crews all already have a `deleted_at` column that their select RLS filters on — so an admin soft-delete would take effect app-wide with no new policy.

## How admin access works

Admins are an email allowlist, `ADMIN_EMAILS` (comma-separated, server-only, documented in the root `.env.example`). It's the smallest mechanism that fits: the database has no role to check, and the codebase's own comments already route admin work through the service-role client from `apps/web`, not a new Postgres role.

`lib/auth/admin.ts` is the single gate:

- `getAdminStatus()` calls `supabase.auth.getUser()`, which re-validates the session with Supabase Auth on every call (unlike `getSession()`, which trusts the cookie), then checks the allowlist. Wrapped in React `cache()` so one request asks once.
- `requireAdmin()` redirects a signed-out visitor to `/admin/login` and a signed-in non-admin to `/admin/not-authorized`. It's called by **every** privileged read and **every** Server Action — not just the layout.

That last point was confirmed live, not assumed. With the gate only in the layout, signing in as a non-admin showed "Not authorized" while the server log showed the reports page had *also* run in parallel — the App Router renders a page alongside its layout, and layouts aren't re-run on client navigation. The data-layer check is what actually kept the service-role query from executing.

Sign-in is a plain email/password form (`/admin/login`) using the browser Supabase client, which writes the session cookie that the server then reads. Any account can sign in; only allowlisted ones get past the gate.

## What an admin can do

**Review reports** (`/admin/reports`): filter by status (pending by default), and see each report with enough context to act — who reported it, the reporter's note, and the target itself: the reported user's handle and suspension state, or the post/comment text, place/crew name, or event title, fetched per type with typed queries. Actions per open report:

- **Start review** / **Resolve, no action** / **Dismiss**, writing `resolved_by` and `resolved_at`. Closed reports can be reopened.
- **Remove {post|comment|place|event|crew}** soft-deletes the target by setting `deleted_at` and resolves the report. The Server Action takes only the report id and reads the target type and id back from the database — a tampered form can't point it at an arbitrary table or row.
- **Suspend user** (on reports against a user), with a reason that the suspended user will see.

**Manage users** (`/admin/users`): search by username, or by default see everyone currently suspended — so a suspension can always be found and lifted, even after its report is closed. The search input is normalized to the username character set before it reaches the `ilike` filter.

Destructive actions (removal, suspension) ask for confirmation first. An admin can't suspend their own account.

## Suspension

`20261012000000_admin_suspension.sql` adds `profiles.suspended_at` and `suspended_reason`, enforced in two places:

1. **`is_content_visible_to()`** hides a suspended user's posts, vibes, events, and check-ins from everyone — themselves included, since the check runs before the owner-can-always-see-their-own shortcut.
2. **The mobile app's root navigator** shows a "your account has been suspended" screen, with the moderator's reason and a log-out button, in place of the whole app. It's the same position in the tree as the existing onboarding gate, so it replaces every route, deep links included.

### What suspension does not cover

It does **not** retrofit every insert policy across the schema. A suspended user who skips the mobile app and calls the Supabase API directly with a still-valid token could still write rows (a post, a reaction). Those rows would be invisible to everyone, because of the visibility check, but they'd exist. Closing that properly means adding a suspension check to every insert policy, or revoking the user's sessions on suspend through the Auth admin API. It's a real, broader hardening gap, left for the security pass in Phase 14 rather than half-done here.

## Next.js 16 Cache Components

`apps/web` runs with `cacheComponents: true`, which changes where request-time reads can live. Three things came up live, each fixed following the Next.js guide that ships in `node_modules/next/dist/docs` ("Authentication with Cache Components"):

- Reading the session (`cookies()`) at a layout's or page's top level is an error. Session-dependent UI streams in behind `<Suspense>`, while the static chrome (header, nav, headings) still prerenders. The guide offers `export const instant = false` as an opt-out, but frames it as a migration stopgap, so the proper boundary structure is used instead.
- With `partialPrefetching` on, a runtime prefetch render can resolve `cookies()` and then hit `Date.now()` inside Supabase's token-expiry check — an unstable value in a prerender. `getAdminStatus()` calls `await connection()` first. That isn't a workaround: an auth round-trip to Supabase Auth only makes sense per request.
- Each segment validates on its own, so pages that read `searchParams` also wrap that part in their own boundary.

What remains in the dev log is a notice that instant-navigation validation can't render past the auth redirect for a signed-out or non-admin visitor. That's expected for a gated route and is dev-only.

## Not built

- **Admin management of challenges, cities (`is_launched`), and places/events beyond removing reported ones.** All are real tables with no admin path, but they're content management, not moderation. `challenges` is still seeded only via `supabase/seed.sql`.
- **Reports against a business.** Nothing in the app can file one (businesses have no detail screen), so there's nothing to review.
- **Restoring removed content from the UI.** It's a soft delete, so it can be undone by clearing `deleted_at`, but there's no button for that yet.
- **Analytics** — Phase 13.

## Verified

End to end, against the live local stack, with a real admin account, a reporter (henry), and a reported user (ivy):

- Signed-out `/admin/reports` redirects to login. Henry, signed in but not allowlisted, lands on "Not authorized", with no privileged query run and no server error.
- The admin's queue showed both of henry's reports with real context: ivy's post text, `@ivy`, the reporter's notes.
- **Remove post** soft-deleted exactly that post — ivy's other post was untouched — and resolved the report with the admin recorded in `resolved_by`.
- **Suspend user** stored the admin's custom reason and resolved the report. `is_content_visible_to` then returned false for ivy's remaining post, for henry, for ivy herself, and for an anonymous viewer.
- Ivy signing into the mobile app got the suspended screen with that exact reason.
- **Lift suspension** on the Users page cleared it. Ivy's content became visible again and her app loaded normally.
- A username search for `HENRY%,` normalized to `henry` and found the right account.
