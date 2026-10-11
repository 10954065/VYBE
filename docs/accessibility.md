# Accessibility

Phase 14's pass, from an audit of every `Pressable` in `apps/mobile/src` (parsed properly — a regex stops at the `>` inside `() =>` and misreports).

## Fixed

- **`ThemedButton`** — the app's primary button, used for sign in, post, check in and most other actions — had no button role, so VoiceOver read every one of them as plain text. While loading it swapped its title for a spinner, leaving it with no name at all. It now has `accessibilityRole="button"`, a permanent `accessibilityLabel`, and `aria-busy`.
- **20 more tappable elements** had no role. Each now has one, chosen for what it is:
  - segmented tabs (Crews and Profile sub-tabs): `tab` with `aria-selected`;
  - single-choice pickers (sort chips, event filters, crew privacy, vibe type, report category): `radio` with `aria-checked`;
  - the collapsible: `button` with `aria-expanded`;
  - everything else: `button`.
- **`aria-*` props, not `accessibilityState`.** React Native Web ignores `accessibilityState` entirely (checked in its source: it only reads `aria-*` and the old `accessibility*` booleans), so selected and checked states never reached the browser. React Native supports the same `aria-*` props on iOS and Android, so one prop works everywhere. Verified on web: the Explore sort chips are announced as radios with the active one checked.
- **Alerts and confirmations on web.** React Native Web's `Alert.alert` is a no-op, so on web every confirmation (delete account) and every error or success message (could not join, report submitted) silently did nothing. All of them now go through `showAlert` / `confirmDestructive` in `lib/confirm.ts`, which use the browser's dialogs on web.
- **Comment composer** (`features/feed/comment-composer.tsx`): labelled input, labelled send button with busy state, focus shown on the whole field, and errors announced politely.

## Still open

- **Cards that contain their own buttons** (Explore place card with Directions; event highlight card with Join and Share). A button role on the card would put buttons inside a button — invalid on web — so the cards have none. On iOS, VoiceOver may also treat each card as a single element, making the inner buttons hard to reach. The proper fix is custom accessibility actions on the card (`accessibilityActions`), best checked on a real device with VoiceOver.
- **Dynamic Type and reduced motion** haven't been audited yet.
- **A screen-reader walkthrough on a real device** is still to do; everything above was checked in code and in the browser's accessibility tree.
