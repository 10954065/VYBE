# Implementation Roadmap

Each phase ships as its own set of commits. Design (Stitch) integration happens inside the relevant phase once assets are available — it does not block the architecture underneath it.

- [x] **Phase 1 — Foundation**: repo audit, monorepo architecture, dependencies, tooling, environment setup.
- [x] **Phase 2 — Database**: schema, migrations, RLS policies, seed data. Validated against a live local Supabase stack, not just parse-checked.
- [x] **Phase 3 — Auth & profiles**: sign up, sign in, password reset request, session-gated routing (`Stack.Protected`), onboarding (username/display name/interests), profile view, logout, and account deletion (mobile → `apps/web` API → Auth Admin API). Verified end-to-end in a real browser against the live local stack, not just typechecked — see `docs/database-schema.md` for the bugs that surfaced only by doing that (an SSR crash, a `SecureStore` web gap, and a Zod datetime bug that caused a real infinite refetch loop). Not yet built: profile editing, avatar upload (needs Storage, not yet configured), email-confirmation deep linking.
- [x] **Phase 4 — Home feed**: posts, reactions, comments, following, pagination. Feed is a keyset-paginated RPC (`get_home_feed`) scoped to people you follow plus yourself; a "People to follow" strip (`get_suggested_people`) solves the empty-feed bootstrap problem until Discovery (Phase 9) exists. Verified end-to-end in a real browser — see `docs/feed.md`, including a real bug (not the already-documented NativeTabs web limitation) found while wiring up the comments screen: nesting a `Stack` inside a `NativeTabs.Trigger` doesn't deep-link reliably on web in Expo SDK 57, fixed by restructuring to a `Stack` that wraps the tab navigator instead. Not yet built: multi-reaction picker (schema supports it, UI doesn't yet), unfollow UI, ranked/non-recency feed ordering.
- [ ] **Phase 5 — Real world**: vibes, places, events, check-ins.
- [ ] **Phase 6 — Crews**.
- [ ] **Phase 7 — Retention loop**: XP, levels, streaks, badges, challenges.
- [ ] **Phase 8 — Notifications**: in-app + push.
- [ ] **Phase 9 — Discovery**: search, trending, recommendations.
- [ ] **Phase 10 — Sharing & deep links**.
- [ ] **Phase 11 — Moderation & safety**.
- [ ] **Phase 12 — Admin dashboard**.
- [ ] **Phase 13 — Analytics** (PostHog events).
- [ ] **Phase 14 — Testing, performance, security, accessibility hardening**.
- [ ] **Phase 15 — Production build & deployment**.

## Notes

- Visual UI is intentionally minimal until Stitch design assets land; screens get real data and real navigation first, polish follows the design system.
- Each phase should leave `npm run typecheck` and `npm run lint` clean before moving to the next.
