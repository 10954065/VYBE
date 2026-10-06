import { z } from "zod";

/** Mirrors the `cities` table. Validates API responses, not static config. */
export const citySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  country: z.string(),
  timezone: z.string(),
  center_lat: z.number(),
  center_lng: z.number(),
  is_launched: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export type CityRow = z.infer<typeof citySchema>;
