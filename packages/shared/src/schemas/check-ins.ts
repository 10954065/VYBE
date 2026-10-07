import { z } from "zod";

import { postVisibilitySchema } from "./posts";

export const checkInSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  author_username: z.string(),
  author_display_name: z.string().nullable(),
  author_avatar_url: z.url().nullable(),
  place_id: z.uuid().nullable(),
  event_id: z.uuid().nullable(),
  note: z.string().nullable(),
  visibility: postVisibilitySchema,
  created_at: z.coerce.date(),
});
export type CheckIn = z.infer<typeof checkInSchema>;

export const createCheckInInputSchema = z
  .object({
    place_id: z.uuid().optional(),
    event_id: z.uuid().optional(),
    note: z.string().trim().max(280).optional(),
    visibility: postVisibilitySchema.default("followers"),
  })
  .refine((value) => !!value.place_id || !!value.event_id, {
    message: "A check-in needs a place or an event.",
  });
export type CreateCheckInInput = z.infer<typeof createCheckInInputSchema>;

// Matches Postgres errcode P0001 raised by enforce_check_in_rate_limit().
export const CHECK_IN_RATE_LIMITED_MESSAGE = "check_in_rate_limited";
