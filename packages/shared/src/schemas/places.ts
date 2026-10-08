import { z } from "zod";

import { CATEGORIES } from "../constants/interests";

export const categorySchema = z.enum(CATEGORIES);

export const placeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  category: categorySchema,
  address: z.string().nullable(),
  city_id: z.uuid().nullable(),
  lat: z.number(),
  lng: z.number(),
  cover_image_url: z.url().nullable(),
  business_id: z.uuid().nullable(),
  popularity_score: z.coerce.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Place = z.infer<typeof placeSchema>;

// Derived from place_rating_aggregates (a view, not stored). avg_rating is
// null when nobody has rated the place yet.
export const placeRatingAggregateSchema = z.object({
  place_id: z.uuid(),
  avg_rating: z.coerce.number().nullable(),
  rating_count: z.coerce.number().int().nonnegative(),
});
export type PlaceRatingAggregate = z.infer<typeof placeRatingAggregateSchema>;

export const placeRatingSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  place_id: z.uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type PlaceRating = z.infer<typeof placeRatingSchema>;

// Rating requires a prior check-in at the place — enforced server-side by
// place_ratings_insert_self_with_visit, not just here.
export const createPlaceRatingInputSchema = z.object({
  place_id: z.uuid(),
  rating: z.number().int().min(1, "Pick a star rating.").max(5),
  review: z.string().trim().max(500).optional(),
});
export type CreatePlaceRatingInput = z.infer<typeof createPlaceRatingInputSchema>;

// Shape returned by the `get_busiest_place_now` RPC — the single place
// with the most recent check-ins citywide, if any.
export const busiestPlaceSchema = z.object({
  place_id: z.uuid(),
  place_name: z.string(),
  place_address: z.string().nullable(),
  check_in_count: z.coerce.number().int().nonnegative(),
});
export type BusiestPlace = z.infer<typeof busiestPlaceSchema>;

// Shape returned by the `get_places_with_stats` RPC — places with real
// rating aggregates and recent check-in counts flattened in.
export const placeWithStatsSchema = placeSchema.extend({
  avg_rating: z.coerce.number().nullable(),
  rating_count: z.coerce.number().int().nonnegative(),
  recent_check_in_count: z.coerce.number().int().nonnegative(),
});
export type PlaceWithStats = z.infer<typeof placeWithStatsSchema>;
