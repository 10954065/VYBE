import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

interface ApproveMemberInput {
  crewId: string;
  userId: string;
}

export function useApproveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ crewId, userId }: ApproveMemberInput) => {
      const { error } = await supabase
        .from("crew_members")
        .update({ status: "approved" })
        .eq("crew_id", crewId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_data, { crewId }) => {
      queryClient.invalidateQueries({ queryKey: ["crew-pending-members", crewId] });
      queryClient.invalidateQueries({ queryKey: ["crew-members", crewId] });
      queryClient.invalidateQueries({ queryKey: ["crew", crewId] });
    },
  });
}
