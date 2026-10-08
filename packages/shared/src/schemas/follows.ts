import { z } from "zod";

export const toggleFollowInputSchema = z.object({
  target_user_id: z.uuid(),
  is_following: z.boolean(),
});
export type ToggleFollowInput = z.infer<typeof toggleFollowInputSchema>;

// Shape returned by the `get_social_proof` RPC. "Friend" has no table of
// its own — it's exactly the mutual-follow case (viewer follows target AND
// target follows viewer back), same definition is_content_visible_to() uses
// for 'friends' visibility.
export const socialProofSchema = z.object({
  is_friend: z.boolean(),
  mutual_friend_count: z.coerce.number().int().nonnegative(),
});
export type SocialProof = z.infer<typeof socialProofSchema>;
