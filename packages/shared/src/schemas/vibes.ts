import { z } from "zod";

import { VIBE_TYPES } from "../constants/vibes";
import { postVisibilitySchema } from "./posts";

export const vibeTypeSchema = z.enum(VIBE_TYPES);

// A vibe joined with its author, as shown in a place's "who's here" list.
export const vibeSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  author_username: z.string(),
  author_display_name: z.string().nullable(),
  author_avatar_url: z.url().nullable(),
  vibe_type: vibeTypeSchema,
  text: z.string().nullable(),
  place_id: z.uuid().nullable(),
  visibility: postVisibilitySchema,
  expires_at: z.coerce.date(),
  created_at: z.coerce.date(),
});
export type Vibe = z.infer<typeof vibeSchema>;

export const createVibeInputSchema = z.object({
  vibe_type: vibeTypeSchema,
  text: z.string().trim().max(280).optional(),
  place_id: z.uuid().optional(),
  visibility: postVisibilitySchema.default("followers"),
});
export type CreateVibeInput = z.infer<typeof createVibeInputSchema>;
