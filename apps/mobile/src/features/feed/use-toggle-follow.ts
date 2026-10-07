import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFollowInputSchema, type ToggleFollowInput } from "@vybe/shared";

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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-feed", userId] });
      queryClient.invalidateQueries({ queryKey: ["suggested-people", userId] });
    },
  });
}
