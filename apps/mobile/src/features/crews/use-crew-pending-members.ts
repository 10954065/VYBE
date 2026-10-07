import { useQuery } from "@tanstack/react-query";
import { crewMemberSchema, type CrewMember } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

export function useCrewPendingMembers(crewId: string | undefined, isAdmin: boolean) {
  return useQuery({
    queryKey: ["crew-pending-members", crewId],
    enabled: !!crewId && isAdmin,
    queryFn: async (): Promise<CrewMember[]> => {
      const { data, error } = await supabase
        .from("crew_members")
        .select("crew_id, user_id, role, status, joined_at, profile:profiles(username, display_name, avatar_url)")
        .eq("crew_id", crewId!)
        .eq("status", "pending")
        .order("joined_at", { ascending: true })
        .limit(100);
      if (error) throw error;

      return (data ?? []).map((row) =>
        crewMemberSchema.parse({
          ...row,
          username: row.profile?.username,
          display_name: row.profile?.display_name ?? null,
          avatar_url: row.profile?.avatar_url ?? null,
        }),
      );
    },
  });
}
