import { useQuery } from "@tanstack/react-query";
import { myProfileStatsSchema, type MyProfileStats } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useMyProfileStats() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-profile-stats", userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyProfileStats> => {
      const { data, error } = await supabase.rpc("get_my_profile_stats");
      if (error) throw error;
      return myProfileStatsSchema.parse(
        data?.[0] ?? { distinct_events: 0, distinct_places: 0, longest_outside_streak: 0, crew_count: 0 },
      );
    },
  });
}
