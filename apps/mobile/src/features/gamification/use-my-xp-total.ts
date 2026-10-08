import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

const totalXpSchema = z.object({ total_xp: z.coerce.number().int().nonnegative() });

export function useMyXpTotal() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-xp-total", userId],
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("user_xp_totals")
        .select("total_xp")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return totalXpSchema.parse(data ?? { total_xp: 0 }).total_xp;
    },
  });
}
