import { useQuery } from "@tanstack/react-query";
import { personOutsideNowSchema, type PersonOutsideNow } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function usePeopleOutsideNow() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["people-outside-now", userId],
    enabled: !!userId,
    // Presence is time-sensitive — refetch more eagerly than the global
    // 30s staleTime default.
    staleTime: 60_000,
    queryFn: async (): Promise<PersonOutsideNow[]> => {
      const { data, error } = await supabase.rpc("get_people_outside_now", { result_limit: 10 });
      if (error) throw error;
      return (data ?? []).map((row) => personOutsideNowSchema.parse(row));
    },
  });
}
