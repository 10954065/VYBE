# Home Feed, Reactions, Comments & Following

## Architecture

- **Feed query**: `get_home_feed(page_size, before_created_at, before_id)` (`supabase/migrations/20261007090000_feed.sql`) — posts authored by people the caller follows, plus their own, newest first, keyset-paginated. Recency-only for now; `architecture.md`'s `FeedRankingService` (engagement/interests/city/crew weighting) is a later swap-in behind the same RPC, not yet implemented.
- **Mobile**: `apps/mobile/src/features/feed/` — `use-home-feed` (`useInfiniteQuery`), `use-create-post`, `use-toggle-reaction` (optimistic, rolls back on error), `use-comments`/`use-add-comment`, `use-toggle-follow`, `use-suggested-people`. Screens: `app/(app)/(tabs)/home.tsx` (feed + composer + suggested-people strip), `app/(app)/post/[id].tsx` (comments, pushed on top of the tabs).
- **Reactions**: one type (`like`) surfaced in the UI for now, even though `reactions.reaction_type` already supports `love|fire|laugh|wow` — a 5-emoji picker is UI scope that didn't exist yet to justify (YAGNI), not a schema limitation.
- **Following people**: the home feed only ever shows posts from people you already follow (plus your own), so a newly onboarded user following nobody would have no way to populate it. `get_suggested_people` (profiles not already followed, excluding self) backs a "People to follow" strip in the feed header for exactly this bootstrap case. It is **not** Discovery (Phase 9) — no search, ranking, or interest matching.

## Routing: nesting a push screen under a NativeTabs tab (a real bug found by testing)

The comments screen needs to push on top of the tab bar from the Home tab. Expo's own docs say to "nest a `<Stack />` layout inside each tab to support headers and pushing screens," so the first attempt was:

```
(app)/index/_layout.tsx     <- Stack, nested inside the "index" NativeTabs.Trigger
(app)/index/index.tsx       <- the actual Home screen
(app)/index/post/[id].tsx   <- pushed screen
```

This renders, but breaks in two ways, both only visible by actually running it in a browser:

1. **A directory and a file inside it sharing the literal name `index`** triggers Expo Router's own "Found screens with the same name nested inside one another" warning — a directory named `index` collapses to its parent's path exactly like a file named `index.tsx` does, so `(app)/index/index.tsx` produces two route nodes both representing `(app)`'s own path. Renaming the directory to `home` (`(app)/home/index.tsx`) fixes the warning, but:
2. **A `<Stack/>` nested inside a `NativeTabs.Trigger` doesn't deep-link reliably on web in this Expo SDK (57).** The typed-routes generator lists `/home/index` as a valid literal path, but at runtime the tab trigger's `href` pointed at it resolved to a `+not-found` route, and loading the app's root URL landed on the *wrong tab* (Explore) instead of Home.

Fixed by abandoning the "Stack inside a tab" pattern entirely in favor of the other standard layout — a `Stack` that wraps the tab navigator as one screen, with the push target as a sibling, not nested inside any tab:

```
(app)/_layout.tsx        <- Stack: screens "(tabs)" and "post/[id]"
(app)/(tabs)/_layout.tsx <- NativeTabs (unchanged content, just relocated)
(app)/(tabs)/home.tsx
(app)/(tabs)/explore.tsx
(app)/(tabs)/profile.tsx
(app)/post/[id].tsx       <- pushed on top of the tabs, a sibling of "(tabs)", not inside it
```

This is the same shape already used successfully at the root `_layout.tsx` for `(auth)`/`(onboarding)`/`(app)`, and it works: no router warnings, the correct tab loads by default, and `router.push('/post/[id]')` from the Home tab pushes a screen with a working native back button that actually returns to Home (confirmed — see note below).

**Not a new instance of the documented NativeTabs web-fallback limitation** (`docs/auth.md`) — that one is about the web shim's own tab bar not deep-linking to non-default tabs. This one was a genuine bug in nesting a Stack inside a tab trigger, now avoided structurally rather than worked around.

**Cosmetic, harmless leftover**: the pushed screen's web header renders an auto-generated back link with `href="/explore"` in the accessibility tree, regardless of which tab you actually came from. Clicking it still correctly pops the stack back to wherever you came from (verified: came from `/home`, landed back on `/home` with all state — reaction/comment counts, the new post — intact) because the click handler does a real stack pop, not a literal navigation to that href. Not worth chasing further; it's a display-only artifact of the experimental native-tabs integration, same category as the already-documented web limitation.

## Comment composer

`features/feed/comment-composer.tsx` replaced the original input-plus-"Send"-button row, where the pill button had no horizontal padding and the label was crushed into a narrow capsule. It's now one rounded field holding the input and a round arrow send button (violet with the primary glow when there's text, muted when empty, a spinner while sending), with the field's border turning violet on focus. The input grows with its content up to a few lines, then scrolls; on web that needs explicit sizing from `onContentSizeChange` (textareas don't auto-grow, default to two rows, and never report a shrinking height, so an emptied input snaps back to one line explicitly). The bar rides up with the keyboard via Reanimated's `useAnimatedKeyboard` — before this the iOS keyboard covered it.

Two real bugs fixed alongside it:

- **Stale comment count on the post screen.** `use-add-comment` invalidated the comments list and the home feed but not `['post', id]` (added in Phase 10) or crew feeds, so the post above the comments kept its old count. Now invalidates all three.
- **Sent comments landed off-screen.** After sending, the list now follows its end until the new comment is in view. `scrollToEnd` alone stopped short — it relies on FlatList's estimate for rows it hasn't measured yet — so it scrolls by the real reported content height minus the list's height instead.

## Verified end-to-end (local stack, real browser)

Signed in as a seeded dev user with 25 staggered test posts across 3 followed accounts: feed pagination (first page caps at 20, scrolling loads the rest via the keyset cursor), creating a post (appears at the top immediately), toggling a reaction (optimistic update, persisted, survives reload), viewing and adding a comment (count syncs back into the feed), and following a suggested person (removes them from the suggestion strip, confirmed via a direct `201 Created` on `/rest/v1/follows`).
