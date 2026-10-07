# Implementation Roadmap

Each phase ships as its own set of commits. Design (Stitch) integration happens inside the relevant phase once assets are available — it does not block the architecture underneath it.

- [x] **Phase 1 — Foundation**: repo audit, monorepo architecture, dependencies, tooling, environment setup.
- [x] **Phase 2 — Database**: schema, migrations, RLS policies, seed data. Validated against a live local Supabase stack, not just parse-checked.
- [x] **Phase 3 — Auth & profiles**: sign up, sign in, password reset request, session-gated routing (`Stack.Protected`), onboarding (username/display name/interests), profile view, logout, and account deletion (mobile → `apps/web` API → Auth Admin API). Verified end-to-end in a real browser against the live local stack, not just typechecked — see `docs/database-schema.md` for the bugs that surfaced only by doing that (an SSR crash, a `SecureStore` web gap, and a Zod datetime bug that caused a real infinite refetch loop). Not yet built: profile editing, avatar upload (needs Storage, not yet configured), email-confirmation deep linking.
- [x] **Phase 4 — Home feed**: posts, reactions, comments, following, pagination. Feed is a keyset-paginated RPC (`get_home_feed`) scoped to people you follow plus yourself; a "People to follow" strip (`get_suggested_people`) solves the empty-feed bootstrap problem until Discovery (Phase 9) exists. Verified end-to-end in a real browser — see `docs/feed.md`, including a real bug (not the already-documented NativeTabs web limitation) found while wiring up the comments screen: nesting a `Stack` inside a `NativeTabs.Trigger` doesn't deep-link reliably on web in Expo SDK 57, fixed by restructuring to a `Stack` that wraps the tab navigator instead. Not yet built: multi-reaction picker (schema supports it, UI doesn't yet), unfollow UI, ranked/non-recency feed ordering.
- [x] **Phase 5 — Real world**: vibes, places, events, check-ins. Explore tab is real now (places/events browse, city-scoped), with a place detail screen (check in, share a vibe, see who's here, upcoming events there) and an event detail screen (RSVP, check in, live attendee counts via `get_event_attendee_summary`). Event creation is a plain form (no place picker or rich date UI yet — deliberately deferred, see `docs/places-events.md`). Verified end-to-end in a real browser, including the check-in rate limit's error path and a real pre-existing bug found along the way: `app-tabs.web.tsx`'s floating web tab bar had no `bottom` anchor, so it sat invisibly over the top of every screen intercepting clicks — never triggered before because no earlier screen had interactive elements that high up. Fixed with an explicit `bottom: 0` and `pointerEvents: 'box-none'` so empty padding doesn't swallow clicks meant for the content under it.
- [x] **Phase 6 — Crews**: browse (public and private, both discoverable), create, join/request-to-join, admin approve/reject of pending requests, leave, member list, and a crew-scoped feed (posts with `crew_id` set and `visibility: 'crew'`, reusing Phase 4's post pipeline rather than a separate table). All DB-side from Phase 2 — this phase was entirely new UI plus one real PostgREST bug, fixed: an unqualified `profiles(...)` embed on `posts` is ambiguous because of the unused `saved_posts` many-to-many junction table, rejected with a 300 Multiple Choices; fixed with the FK-qualified `profiles!posts_author_id_fkey(...)` form. See `docs/crews.md`. Not yet built: ownership transfer (an owner can leave their own crew with no succession), crew avatar/cover image upload (needs Storage).
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

- Stitch design assets have landed ("Afro-Electric Neon Obsidian" — see `docs/design-system.md`) and visual integration is underway, screen by screen, alongside the phases above rather than as a phase of its own. Auth screens and the shared themed primitives are done; the rest of the 18-screen Stitch set is still ahead.
- Each phase should leave `npm run typecheck` and `npm run lint` clean before moving to the next.
