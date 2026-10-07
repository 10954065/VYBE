# Auth & Profiles

## Architecture

- **Identity**: Supabase Auth (`auth.users`). `public.profiles` is the 1:1 public row, created automatically by the `handle_new_user()` trigger (see `docs/database-schema.md`).
- **Mobile session storage**: `apps/mobile/src/lib/supabase/large-secure-store.ts`. Native: AES-256-encrypted session in `AsyncStorage`, key in `expo-secure-store` (SecureStore's 2048-byte cap is too small for a session blob). Web: plain `localStorage` — `expo-secure-store` has no web implementation at all, confirmed by this exact file crashing in a real browser test before the `Platform.OS` branch was added.
- **Mobile routing**: `apps/mobile/src/app/_layout.tsx` gates `(auth)` / `(onboarding)` / `(app)` route groups via `Stack.Protected`, driven by `useSession()` (`lib/auth/session-provider.tsx`) and `useProfile()` (`features/profile/use-profile.ts`). No session → `(auth)`. Session but `onboarding_completed_at` is null → `(onboarding)`. Otherwise → `(app)`.
- **Web**: `apps/web/src/lib/supabase/{client,server,admin}.ts` — browser and server (`@supabase/ssr`) clients are RLS-bound; `admin.ts` is the service-role client, guarded by `import "server-only"` so bundling it into a Client Component is a build error. `src/middleware.ts` refreshes the session cookie on every request.
- **Account deletion**: mobile has no service-role access, so it can't delete `auth.users` directly. It calls `POST apps/web/.../api/account/delete` with its Supabase access token as a Bearer header (no shared cookie jar between the native app and the web API); the route verifies that token against the anon-scoped client, then uses the admin client to delete the user. The cascade graph this relies on is documented and was verified by an actual deletion in `docs/database-schema.md`.
- **Dev user seeding**: `apps/web/scripts/seed-dev-users.ts` (`npm run db:seed-users` from `apps/web`) creates demo accounts via the Auth Admin API.

## Bugs this surfaced that code review wouldn't have caught

All three were found by actually running the app in a browser against the live local stack (Playwright), not by reading the code:

1. **SSR crash on the mobile app's web target.** `AsyncStorage`/`SecureStore` reference `window`, which doesn't exist during Expo Router's server-rendering pass. Fixed by switching `apps/mobile/app.json`'s `web.output` from `static` to `single` (plain SPA) — `single` is also Expo's own default; the template had opted into `static`.
2. **`expo-secure-store` has no web implementation.** `deleteValueWithKeyAsync is not a function` on `signOut()`/session changes. Fixed with a `Platform.OS === 'web'` branch to `localStorage`, matching Expo's own documented pattern for this exact case.
3. **Infinite refetch loop on first sign-up.** `profileSchema` used `z.iso.datetime()`, which requires a literal `Z` suffix; Postgres/PostgREST emit timestamps as `...+00:00`, so every profile fetch failed validation. The resulting error state flipped `isProfileLoading`, which made `_layout.tsx`'s loading gate unmount and remount the `Stack` on every attempt — and an errored query refetches on every new observer mount regardless of `staleTime` — so it never stopped. Fixed by switching `created_at`/`updated_at`/`onboarding_completed_at` to `z.coerce.date()` (native `Date` parsing, which already handles Postgres's offset format) in both `profiles.ts` and `cities.ts`.

## Known limitation (not a VYBE bug)

`expo-router/unstable-native-tabs`'s web fallback doesn't support deep-linking directly to a non-default tab (`/profile` redirects to `/`) and renders generic placeholder chrome unrelated to the configured `NativeTabs.Trigger`s. This is a limitation of that experimental API's web shim — the real iOS/Android native tab bars it renders in production don't have this issue. Not worth working around since web is a dev-convenience target for this app, not a shipped platform (per the architecture: web product surface is `apps/web`, a separate Next.js app).
