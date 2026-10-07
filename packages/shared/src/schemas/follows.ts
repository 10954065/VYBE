import { z } from "zod";

export const toggleFollowInputSchema = z.object({
  target_user_id: z.uuid(),
  is_following: z.boolean(),
});
export type ToggleFollowInput = z.infer<typeof toggleFollowInputSchema>;
