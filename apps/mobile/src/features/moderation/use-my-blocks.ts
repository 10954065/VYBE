import { useQuery } from "@tanstack/react-query";
import { blockedUserSchema, type BlockedUser } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useMyBlocks() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-blocks", userId],
    enabled: !!userId,
    queryFn: async (): Promise<BlockedUser[]> => {
      const { data, error } = await supabase.rpc("get_my_blocks");
      if (error) throw error;
      return (data ?? []).map((row) => blockedUserSchema.parse(row));
    },
  });
}
