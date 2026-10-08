import { useQuery } from "@tanstack/react-query";
import { xpTransactionSchema, type XpTransaction } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useMyRecentXp() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-recent-xp", userId],
    enabled: !!userId,
    queryFn: async (): Promise<XpTransaction[]> => {
      const { data, error } = await supabase
        .from("xp_transactions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).map((row) => xpTransactionSchema.parse(row));
    },
  });
}
