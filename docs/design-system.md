# Design system: Afro-Electric Neon Obsidian

## Where it comes from

The visual language is generated in Stitch, not hand-picked — see the `VYBE Social Discovery App Design` Stitch project (18 screens, one shared design system). `docs/roadmap.md` deferred visual polish until these assets existed; they now do, and this is the first pass of wiring them into the actual app.

Stitch's own screen-export and screenshot URLs are signed and Google-account-scoped — they only resolve inside an authenticated browser session, and can't be curled or fetched headlessly from this environment (confirmed: both a fresh Playwright/Chrome-DevTools session and a direct API-key-authenticated request hit Google's sign-in page, since the MCP's API key authenticates `stitch.googleapis.com` calls, not the separate `usercontent.google.com` content host). What *did* work: a real local export of the whole Stitch project (every screen's `code.html` + `screen.png`, plus the design system's `DESIGN.md`), downloaded through an authenticated normal browser and read straight off disk. From the first onboarding pass onward, that export — not the design-system markdown alone — is the source of truth: it carries exact copy, layout, and even working photo URLs (`lh3.googleusercontent.com/aida-public/...`, which — unlike the screenshot/export URLs — turned out to be genuinely public and directly usable as `<Image>` sources). The design system's `designMd` (colors, typography scale, spacing, shape, elevation/glow, per-component specs) is still what the first pass — sign-in/sign-up/forgot-password, before the real export existed — was built from.

## What changed

- **The product is dark-only now**, on purpose. Stitch's design system was generated with `colorMode: DARK` and no light counterpart — the brand ("deep obsidian... saturated neon gradients... club lighting, concert wristbands") doesn't have a light-mode identity to fall back to. `constants/theme.ts`'s `Colors` export is now a single flat palette (previously `Colors.light` / `Colors.dark`, switched by system scheme); `useTheme()` always returns it. `app/_layout.tsx` no longer switches `DarkTheme`/`DefaultTheme` by `useColorScheme()` — it always uses a custom nav theme built from the same tokens.
- **Plus Jakarta Sans** (`@expo-google-fonts/plus-jakarta-sans`) replaces the system font, loaded via `useFonts` in the root layout with four weights (400/600/700/800) matching the design system's type scale. The root layout now blocks on `fontsLoaded` before rendering, same pattern as the existing session/profile loading gate.
- **Themed primitives** (`themed-text.tsx`, `themed-button.tsx`, `themed-view.tsx`, `themed-text-input.tsx`) were rebuilt on the new tokens: pill-shaped buttons and inputs, a violet glow on the primary button (per the design system's "Neon Aura" spec), and a retuned type scale. Because every existing screen already composes these primitives rather than styling raw `Text`/`Pressable`/`TextInput`, the new look cascaded automatically to screens this phase didn't touch directly — the Phase 4 feed composer, suggested-people strip, Phase 5 explore segmented control, and Phase 6 crew cards all picked up the new palette and pill shapes for free. Confirmed live, not assumed.
- **Auth screens** (`sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`) got an explicit pass: a hero "VYBE" wordmark, screen-specific taglines matching the Stitch screen titles, and layout tweaks (plain `View` instead of a `ThemedView` for field grouping, since the old code themed a wrapper that only ever rendered its parent's own background color).

## Two real bugs found during this pass

Both were visible only once the floating web tab bar's chrome actually looked intentional enough to notice what was wrong with it — the same "only showed up once there was something to look at" pattern as the Phase 5 tab-bar-pinned-to-the-top bug.

1. **`app-tabs.web.tsx` was still the unmodified Expo starter scaffold.** It rendered the literal text "Expo Starter" as the brand mark and linked out to `https://docs.expo.dev`, and its `TabList` only had two triggers — `home` and `explore`. `profile.tsx` has existed since Phase 3 with no way to reach it from the web tab bar at all. Fixed: removed the leftover branding/link, added the missing `profile` `TabTrigger`, and restyled the dock (translucent pill, hairline border, glow on the active tab) to match the design system's "Mobile Navigation Dock" component spec. The native tab bar (`app-tabs.tsx`, SF Symbols-based) already had all three tabs correctly — only the web fallback was missing one.
2. **`BottomTabInset` was always `0` on web.** `Platform.select({ ios: 50, android: 80 })` has no `web` case, so every screen that pads its bottom content by `BottomTabInset + Spacing.n` (home, explore, profile) reserved zero space for the floating dock on web specifically. Invisible on home/explore because their lists just clip under the dock quietly; glaring on profile, where the red "Delete account" pill rendered half-swallowed behind the tab bar. Fixed by adding `web: 96` (measured against the dock's actual rendered height) to the `Platform.select`.

## Verified

Live browser, local stack: signed up a confirmed test user via the Admin API, completed onboarding server-side, walked sign-in → home → explore → profile, and screenshotted each. Confirmed the primitive-level reskin reached already-built screens without edits, confirmed both tab-bar fixes (profile reachable, delete-account button clear of the dock), and confirmed `npm run typecheck` / `npm run lint` stay clean across all three workspaces. Test user deleted afterward; local stack stopped.

## Home, Discover, Crews, and Profile (second pass)

Unlike the primitive-level cascade above, these four screens' Stitch designs assumed an entire retention/social layer that didn't exist yet — XP/levels/streaks/badges, friends, "outside now" presence, ratings, a leaderboard, real challenges. Rather than skin around invented numbers, that layer was built for real; see `docs/gamification.md` for the backend and the engine, and `docs/onboarding.md`'s sibling for how each screen's gap was triaged (ported faithfully where the data is now real, cut where Stitch's copy had no generalizable rule behind it — fabricated live counters, a "Featured Collective" hero with no curation criteria, an "I'm Going" place action redundant with real check-in).

One IA change came out of this pass: every Stitch screen's bottom nav shows a dedicated Crews tab, not a segment inside Discover. The app now matches — Crews is its own tab (My Crews / Explore / City Board), and Discover dropped back to Places/Events.

## Deferred

Sign-in/sign-up/forgot-password (this doc) and the 3-step onboarding flow (`docs/onboarding.md`) are done. Home/Discover/Crews/Profile (`docs/gamification.md`) are done. Still ahead:

- **Direct Chat and Squad Group Chat** — Stitch generated both, but there is no messages/conversations table or backend anywhere in Phases 1–6. This is a new feature, not a reskin, and isn't in `docs/roadmap.md`. Flagged, not started.
- **App icon and splash screen** — still the unmodified Expo starter logo and blue gradient. Stitch generates app *screens*, not an app icon/logomark asset, so this needs either a dedicated asset or a deliberate decision to typeset a wordmark instead.
- **Avatar upload** — needs Storage, not yet configured (flagged since Phase 3). Profile's new Edit screen covers every other editable field.
- **Real ticket payments** — event `price_label` is deliberately display-only; see `docs/gamification.md`.
