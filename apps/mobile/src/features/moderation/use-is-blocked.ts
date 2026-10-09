import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useIsBlocked(targetId: string | undefined) {
  const { session } = useSession();
  const viewerId = session?.user.id;

  return useQuery({
    queryKey: ["is-blocked", viewerId, targetId],
    enabled: !!viewerId && !!targetId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("blocks")
        .select("blocker_id")
        .eq("blocker_id", viewerId!)
        .eq("blocked_id", targetId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}
