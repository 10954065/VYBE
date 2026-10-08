import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useJoinCrew() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (crewId: string) => {
      if (!userId) throw new Error("Not signed in.");
      // status is server-authoritative (set_crew_member_status trigger) —
      // pending for a private crew, approved for a public one — regardless
      // of what's inserted here.
      const { error } = await supabase.from("crew_members").insert({ crew_id: crewId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: (_data, crewId) => {
      queryClient.invalidateQueries({ queryKey: ["crew-membership", crewId, userId] });
      queryClient.invalidateQueries({ queryKey: ["crew", crewId] });
      queryClient.invalidateQueries({ queryKey: ["crew-members", crewId] });
      queryClient.invalidateQueries({ queryKey: ["my-crews"] });
      queryClient.invalidateQueries({ queryKey: ["crews"] });
    },
  });
}
