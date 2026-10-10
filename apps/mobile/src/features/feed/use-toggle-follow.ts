import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFollowInputSchema, type ToggleFollowInput } from "@vybe/shared";

import { track } from "@/lib/analytics/analytics";
import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useToggleFollow() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: ToggleFollowInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = toggleFollowInputSchema.parse(input);

      if (parsed.is_following) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", userId)
          .eq("following_id", parsed.target_user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: userId, following_id: parsed.target_user_id });
        if (error) throw error;
        track("user_followed");
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["home-feed", userId] });
      queryClient.invalidateQueries({ queryKey: ["suggested-people", userId] });
      queryClient.invalidateQueries({ queryKey: ["is-following", userId, variables.target_user_id] });
      queryClient.invalidateQueries({ queryKey: ["social-proof", userId, variables.target_user_id] });
      queryClient.invalidateQueries({ queryKey: ["profile-follow-counts", variables.target_user_id] });
      queryClient.invalidateQueries({ queryKey: ["profile-follow-counts", userId] });
    },
  });
}
