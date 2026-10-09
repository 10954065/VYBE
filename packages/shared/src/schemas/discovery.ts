import { z } from "zod";

import { categorySchema, placeWithStatsSchema } from "./places";
import { eventWithStatsSchema } from "./events";
import { crewSchema } from "./crews";

// Shapes returned by search_people/search_places/search_events/search_crews
// (20261009000000_search.sql) — lightweight, purpose-built for a results
// row rather than reusing the full entity schemas.
export const searchPersonSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.url().nullable(),
});
export type SearchPerson = z.infer<typeof searchPersonSchema>;

export const searchPlaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  category: categorySchema,
  address: z.string().nullable(),
  cover_image_url: z.url().nullable(),
});
export type SearchPlace = z.infer<typeof searchPlaceSchema>;

export const searchEventSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  cover_image_url: z.url().nullable(),
  place_name: z.string().nullable(),
  start_at: z.coerce.date(),
});
export type SearchEvent = z.infer<typeof searchEventSchema>;

export const searchCrewSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  category: z.string().nullable(),
  avatar_url: z.url().nullable(),
  member_count: z.number().int().nonnegative(),
});
export type SearchCrew = z.infer<typeof searchCrewSchema>;

// Shapes returned by get_recommended_places/get_recommended_events/
// get_recommended_crews (20261009000100_recommendations.sql) — each is
// literally its *_with_stats sibling (or the full crews row) plus one
// friend_*_count column. Built via .extend() rather than hand-duplicated
// so the two stay structurally identical and the client can pass either
// into the same card component (ExplorePlaceCard, HighlightEventCard,
// CrewCard) without a cast.
export const recommendedPlaceSchema = placeWithStatsSchema.extend({
  friend_check_in_count: z.coerce.number().int().nonnegative(),
});
export type RecommendedPlace = z.infer<typeof recommendedPlaceSchema>;

export const recommendedEventSchema = eventWithStatsSchema.extend({
  friend_going_count: z.coerce.number().int().nonnegative(),
});
export type RecommendedEvent = z.infer<typeof recommendedEventSchema>;

export const recommendedCrewSchema = crewSchema.extend({
  friend_member_count: z.coerce.number().int().nonnegative(),
});
export type RecommendedCrew = z.infer<typeof recommendedCrewSchema>;

// Shape returned by get_profile_follow_counts.
export const profileFollowCountsSchema = z.object({
  follower_count: z.coerce.number().int().nonnegative(),
  following_count: z.coerce.number().int().nonnegative(),
});
export type ProfileFollowCounts = z.infer<typeof profileFollowCountsSchema>;
