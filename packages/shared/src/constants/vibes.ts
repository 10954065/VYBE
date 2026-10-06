/** What a user is currently doing/feeling — the core VYBE primitive. */
export const VIBE_TYPES = [
  "outside",
  "food",
  "music",
  "party",
  "sports",
  "chill",
  "date",
  "networking",
  "gaming",
  "study",
  "travel",
  "shopping",
  "fitness",
] as const;

export type VibeType = (typeof VIBE_TYPES)[number];

export const VIBE_VISIBILITY = ["everyone", "followers", "friends", "crew", "only_me"] as const;

export type VibeVisibility = (typeof VIBE_VISIBILITY)[number];

/** Vibes auto-expire; this is the default lifetime absent a user override. */
export const DEFAULT_VIBE_TTL_MINUTES = 180;
