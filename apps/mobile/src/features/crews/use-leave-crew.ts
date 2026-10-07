import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useLeaveCrew() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (crewId: string) => {
      if (!userId) throw new Error("Not signed in.");
      const { error } = await supabase
        .from("crew_members")
        .delete()
        .eq("crew_id", crewId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_data, crewId) => {
      queryClient.invalidateQueries({ queryKey: ["crew-membership", crewId, userId] });
      queryClient.invalidateQueries({ queryKey: ["crew", crewId] });
      queryClient.invalidateQueries({ queryKey: ["crew-members", crewId] });
    },
  });
}
