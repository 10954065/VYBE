/**
 * Interests/vibe-preferences offered during onboarding and used for
 * feed personalization. Configurable here, not hardcoded in UI components.
 */
export const INTERESTS = [
  "music",
  "food",
  "parties",
  "sports",
  "gaming",
  "fitness",
  "networking",
  "business",
  "fashion",
  "art",
  "movies",
  "travel",
  "chill",
  "nightlife",
  "campus",
  "tech",
] as const;

export type Interest = (typeof INTERESTS)[number];

/** Place/event categories. */
export const CATEGORIES = [
  "restaurants",
  "clubs",
  "cafes",
  "gyms",
  "beaches",
  "malls",
  "parks",
  "event_spaces",
  "entertainment",
  "sports",
  "campus",
  "shopping",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];
