import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { crewRoleSchema, crewMemberStatusSchema } from "@vybe/shared";
import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

const membershipSchema = z.object({
  role: crewRoleSchema,
  status: crewMemberStatusSchema,
});
export type Membership = z.infer<typeof membershipSchema>;

export function useMyMembership(crewId: string | undefined) {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["crew-membership", crewId, userId],
    enabled: !!crewId && !!userId,
    queryFn: async (): Promise<Membership | null> => {
      const { data, error } = await supabase
        .from("crew_members")
        .select("role, status")
        .eq("crew_id", crewId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data ? membershipSchema.parse(data) : null;
    },
  });
}
