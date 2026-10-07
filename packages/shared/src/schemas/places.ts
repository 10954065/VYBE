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
