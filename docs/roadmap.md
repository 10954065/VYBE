# Implementation Roadmap

Each phase ships as its own set of commits. Design (Stitch) integration happens inside the relevant phase once assets are available — it does not block the architecture underneath it.

- [x] **Phase 1 — Foundation**: repo audit, monorepo architecture, dependencies, tooling, environment setup.
- [x] **Phase 2 — Database**: schema, migrations, RLS policies, seed data. Validated against a live local Supabase stack, not just parse-checked.
- [~] **Phase 3 — Auth & profiles**: Supabase client wiring done (mobile: encrypted-session storage; web: `@supabase/ssr` server/browser/admin clients + session-refresh middleware), dev user seeding script done. Still open: actual sign-up/login/onboarding screens, password reset, account deletion flow.
- [ ] **Phase 4 — Home feed**: posts, reactions, comments, following, pagination.
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
