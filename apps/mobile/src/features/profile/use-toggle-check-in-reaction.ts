import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

const REACTION_TYPE = "like";

interface ToggleCheckInReactionInput {
  checkInId: string;
  isReacted: boolean;
}

export function useToggleCheckInReaction() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async ({ checkInId, isReacted }: ToggleCheckInReactionInput) => {
      if (!userId) throw new Error("Not signed in.");

      if (isReacted) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("user_id", userId)
          .eq("check_in_id", checkInId)
          .eq("reaction_type", REACTION_TYPE);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("reactions")
          .insert({ user_id: userId, check_in_id: checkInId, reaction_type: REACTION_TYPE });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-check-ins", userId] });
    },
  });
}
