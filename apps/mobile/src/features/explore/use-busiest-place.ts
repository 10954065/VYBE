import { useQuery } from "@tanstack/react-query";
import { busiestPlaceSchema, type BusiestPlace } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

export function useBusiestPlace() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["busiest-place", cityId],
    enabled: !!cityId,
    staleTime: 60_000,
    queryFn: async (): Promise<BusiestPlace | null> => {
      const { data, error } = await supabase.rpc("get_busiest_place_now", { p_city_id: cityId! });
      if (error) throw error;
      const row = data?.[0];
      return row ? busiestPlaceSchema.parse(row) : null;
    },
  });
}
