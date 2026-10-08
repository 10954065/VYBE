import { useQuery } from "@tanstack/react-query";
import { myCheckInSchema, type MyCheckIn } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useMyCheckIns() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-check-ins", userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyCheckIn[]> => {
      const { data, error } = await supabase.rpc("get_my_check_ins", { result_limit: 20 });
      if (error) throw error;
      return (data ?? []).map((row) => myCheckInSchema.parse(row));
    },
  });
}
