/**
 * Accra neighborhoods selected during onboarding as a home-base preference.
 * Independent of `places.neighborhood` free text — this is a fixed,
 * validated set for the onboarding/profile preference, not a place taxonomy.
 */
export const NEIGHBORHOODS = ["osu", "east_legon", "labone", "airport_city", "labadi", "jamestown"] as const;

export type Neighborhood = (typeof NEIGHBORHOODS)[number];

export const TRAVEL_RADII = ["hood", "central", "anywhere"] as const;
export type TravelRadius = (typeof TRAVEL_RADII)[number];
