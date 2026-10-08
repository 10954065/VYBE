import { useQuery } from "@tanstack/react-query";
import { myCrewSchema, type MyCrew } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

/** The viewer's own approved crews, with real presence counts flattened in. */
export function useMyCrews() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-crews", userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyCrew[]> => {
      const { data, error } = await supabase.rpc("get_my_crews", { result_limit: 20 });
      if (error) throw error;
      return (data ?? []).map((row) => myCrewSchema.parse(row));
    },
  });
}
