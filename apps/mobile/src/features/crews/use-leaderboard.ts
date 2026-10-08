import { useQuery } from "@tanstack/react-query";
import { leaderboardEntrySchema, type LeaderboardEntry } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

export function useCityLeaderboard() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["city-leaderboard", cityId],
    enabled: !!cityId,
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase.rpc("get_city_leaderboard", {
        p_city_id: cityId!,
        result_limit: 20,
      });
      if (error) throw error;
      return (data ?? []).map((row) => leaderboardEntrySchema.parse(row));
    },
  });
}
