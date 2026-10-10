import { useMutation, useQueryClient } from "@tanstack/react-query";

import { track } from "@/lib/analytics/analytics";
import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

interface ToggleBlockInput {
  target_user_id: string;
  is_blocked: boolean;
}

export function useToggleBlock() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async ({ target_user_id, is_blocked }: ToggleBlockInput) => {
      if (!userId) throw new Error("Not signed in.");

      if (is_blocked) {
        const { error } = await supabase
          .from("blocks")
          .delete()
          .eq("blocker_id", userId)
          .eq("blocked_id", target_user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blocks")
          .insert({ blocker_id: userId, blocked_id: target_user_id });
        if (error) throw error;
        track("user_blocked");
      }
    },
    // Blocking (not just unblocking) can also silently remove a mutual
    // follow server-side (unfollow_on_block trigger), and affects search,
    // suggestions, and the home feed too -- invalidated broadly rather than
    // just the follow-toggle's narrower set.
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["is-blocked", userId, variables.target_user_id] });
      queryClient.invalidateQueries({ queryKey: ["my-blocks", userId] });
      queryClient.invalidateQueries({ queryKey: ["is-following", userId, variables.target_user_id] });
      queryClient.invalidateQueries({ queryKey: ["social-proof", userId, variables.target_user_id] });
      queryClient.invalidateQueries({ queryKey: ["profile-follow-counts", variables.target_user_id] });
      queryClient.invalidateQueries({ queryKey: ["profile-follow-counts", userId] });
      queryClient.invalidateQueries({ queryKey: ["home-feed", userId] });
      queryClient.invalidateQueries({ queryKey: ["suggested-people", userId] });
      queryClient.invalidateQueries({ queryKey: ["search-people"] });
    },
  });
}
