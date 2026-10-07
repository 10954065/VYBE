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
  // See packages/shared/src/schemas/profiles.ts for why coerce.date() and
  // not z.iso.datetime() — Postgres's "+00:00" offset fails that regex.
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type CityRow = z.infer<typeof citySchema>;
