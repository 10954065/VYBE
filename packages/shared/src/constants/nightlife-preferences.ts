/** How a user says they go out, collected during onboarding step 3. */
export const NIGHTLIFE_PACES = ["night_owl", "sundowner", "explorer"] as const;
export type NightlifePace = (typeof NIGHTLIFE_PACES)[number];

/** Whether a user is onboarding toward a squad/crew-first experience or a solo one. */
export const CREW_PREFERENCES = ["squad", "solo"] as const;
export type CrewPreference = (typeof CREW_PREFERENCES)[number];

/**
 * The onboarding privacy toggle only offers two of `POST_VISIBILITIES`
 * (see schemas/posts.ts) — the rest don't make sense as a default for a
 * brand-new profile with no crew or close-friends list yet.
 */
export const DEFAULT_CHECK_IN_VISIBILITIES = ["followers", "only_me"] as const;
export type DefaultCheckInVisibility = (typeof DEFAULT_CHECK_IN_VISIBILITIES)[number];
