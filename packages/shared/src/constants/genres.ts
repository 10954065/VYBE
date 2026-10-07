/**
 * Nightlife music genres selected during onboarding. Rich per-genre
 * display copy (artists, tags, area labels) lives in the mobile app's
 * feature layer — this is just the validated set of slugs.
 */
export const GENRES = ["afrobeats", "amapiano", "highlife", "alte", "drill", "afrohouse"] as const;

export type Genre = (typeof GENRES)[number];
