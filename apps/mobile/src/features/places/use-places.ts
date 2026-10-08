import { useQuery } from "@tanstack/react-query";
import { placeWithStatsSchema, type PlaceWithStats } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

export function usePlaces() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["places", cityId],
    enabled: !!cityId,
    queryFn: async (): Promise<PlaceWithStats[]> => {
      const { data, error } = await supabase.rpc("get_places_with_stats", {
        p_city_id: cityId!,
        result_limit: 50,
      });
      if (error) throw error;
      return (data ?? []).map((row) => placeWithStatsSchema.parse(row));
    },
  });
}
