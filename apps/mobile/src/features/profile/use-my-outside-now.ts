import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useMyOutsideNow() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-outside-now", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("is_outside_now", { p_user_id: userId! });
      if (error) throw error;
      return z.boolean().parse(data ?? false);
    },
  });
}
