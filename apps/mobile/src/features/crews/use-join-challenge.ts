import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useJoinChallenge() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!userId) throw new Error("Not signed in.");
      const { error } = await supabase.from("challenge_participants").insert({ challenge_id: challengeId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-challenge"] });
    },
  });
}
