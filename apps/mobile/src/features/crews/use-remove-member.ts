import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

interface RemoveMemberInput {
  crewId: string;
  userId: string;
}

// Used both to reject a pending request and to remove an approved member —
// crew_members_delete_self_or_admin's RLS policy covers both the same way.
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ crewId, userId }: RemoveMemberInput) => {
      const { error } = await supabase
        .from("crew_members")
        .delete()
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
