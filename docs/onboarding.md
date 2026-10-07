# Onboarding: the real 3-step flow

## Where this came from

The single-screen onboarding from Phase 3 (username, display name, a flat `interests` list) matched what the backend actually modeled at the time. The Stitch export of the real onboarding design is a 3-step wizard — musical taste, home-base neighborhoods, and nightlife pace/crew/privacy — each tied to a real preference, not a mockup. Picking that design up meant expanding the backend to match it, not skinning the old single screen.

## What's new in the data model

- `profiles` gains four columns: `travel_radius`, `nightlife_pace`, `crew_preference` (all nullable, each a small fixed set), and `default_check_in_visibility` (not null, defaults to `'followers'` — reuses the same visibility vocabulary as `posts`/`check_ins`, restricted to the two choices that make sense for a brand-new profile with no crew or close-friends list yet).
- Two new join tables, `user_genres` and `user_neighborhoods`, mirroring Phase 2's `user_interests` exactly: free text, validated at the app layer against `packages/shared`'s `GENRES`/`NEIGHBORHOODS` lists, RLS policies of select-all / insert-self / delete-self.
- `xp_transactions.reason` gains `'complete_onboarding'`, and `packages/shared`'s `XP_AWARDS.complete_onboarding = 100` — the ledger entry Phase 7's retention loop will eventually read from is real starting now, not backfilled later.
- A new `complete_onboarding(...)` Postgres function, `security definer`, called directly via `supabase.rpc()`. It replaces the old client-side "update profile, then delete+insert interests" sequence with one atomic transaction: profile fields, all three preference join-tables, and the XP award together. It derives the user from `auth.uid()` (never a client-supplied id, per the standing rule in `docs/database-schema.md`), and guards against replay — a second call for an already-onboarded profile raises `onboarding_already_completed` rather than awarding XP twice. This was the only reasonable design: `xp_transactions` has no client insert policy at all, by design (XP must never be directly client-writable), so a `security definer` function gated on an idempotency check is the one controlled path that can write it.

## What the mobile wizard actually does

Three step components (`features/onboarding/step-genres.tsx`, `step-neighborhoods.tsx`, `step-preferences.tsx`) share one `useForm<CompleteOnboardingInput>` via `FormProvider`, with `app/(onboarding)/index.tsx` just tracking which step is visible and gating "Next" with `trigger([...fields for that step])` before advancing. The final step's button is the real `handleSubmit` call. There's no separate submission per step — nothing is written until the whole flow completes, so quitting partway through never leaves a half-finished, partially-XP'd profile.

- **Step 1 (genres)**: 6 cards, minimum 3 selected, plus the username/display name fields the old single screen used to own (the Stitch flow assumes those were collected at sign-up, which — in the real phone+OTP+WhatsApp Stitch sign-up — they would have been; in VYBE's actual email/password sign-up, they weren't, so they live here instead).
- **Step 2 (neighborhoods)**: 6 cards with real photos (see below), minimum 1 selected, plus a single-select "maximum vibe radius" preference.
- **Step 3 (pace, crew, privacy)**: three single-select groups (nightlife pace, crew preference, default check-in visibility) and a welcome-bonus card, then the real submit.

## Deliberate departures from the Stitch export

The Stitch screens are richer than what's real, in a few specific ways — kept wherever the gap was just copy, cut wherever it was a false claim:

- **Dropped**: fabricated "live" numbers (`2.8k Vibing Tonight`, `18 Venues Active`) that no backend computes, an "ACTIVE CREW" badge claiming an existing 6-member crew a brand-new signup can't have, and a "free cocktail redeemable via dynamic QR pass" perk with no redemption system behind it. Kept the genuinely real parts of each: the genre/neighborhood descriptive copy (artists, areas, tags — static content, same category as `INTERESTS`/`CATEGORIES`), the crew-dynamics *preference* itself (just reworded from a claimed membership to a stated preference), and the welcome bonus (the real `+100 XP`, without the fake cocktail).
- **Dropped**: the audio-preview widget (a `0:15` track snippet with play/pause and an animated waveform) and the confetti/haptic celebration on hitting 3 genre selections. Both are pure decorative flourish with no real asset or payoff behind them in this pass — cuttable without losing any actual functionality, unlike everything else on this list.
- **Dropped**: the header's "Skip" button and avatar icon. Onboarding is mandatory (`Stack.Protected` gates the whole app on `onboarding_completed_at`), and every step has a real minimum selection, so a "Skip" that doesn't actually skip anything would just be a dead control. The avatar icon had no `onclick` in the original export either — it was already decorative there.
- **Real, not dropped**: the neighborhood and welcome-perk photos are the Stitch export's actual generated images, fetched from their real (publicly reachable) `lh3.googleusercontent.com/aida-public/...` URLs — these aren't placeholders.

## Verified end-to-end

Signed up a fresh confirmed user via the Admin API, walked the real UI through all 3 steps (3 genres, 2 neighborhoods, default pace/crew/privacy), submitted, and landed on `/home` — meaning `onboarding_completed_at` correctly flipped `Stack.Protected`'s guard. Confirmed via direct SQL: `profiles` got all four new columns, `user_genres`/`user_neighborhoods`/`user_interests` all got the right rows, and `xp_transactions` got exactly one `complete_onboarding` / `+100` row. Called the RPC a second time for the same user directly via REST and confirmed it correctly rejects with `onboarding_already_completed` instead of awarding XP again.

## Not done here

Sign-in/sign-up's own Stitch screens (phone number + PIN + WhatsApp OTP + biometric sign-in, live venue capacity, streak-at-risk warnings) depend on infrastructure well beyond this pass — real SMS/WhatsApp provider integration, a venue-capacity data pipeline — and weren't touched; those two screens keep the visual-only pass from `docs/design-system.md`. The remaining Stitch screens (home, explore, crew detail, profile, direct/squad chat) are still ahead — see `docs/design-system.md`'s own list.
