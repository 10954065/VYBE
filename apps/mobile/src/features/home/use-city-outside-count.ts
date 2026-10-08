import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

/** How many distinct profiles in the viewer's city have checked in recently ("2.4k people outside"). */
export function useCityOutsideCount() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["city-outside-count", cityId],
    enabled: !!cityId,
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("get_city_outside_count", { p_city_id: cityId! });
      if (error) throw error;
      return z.coerce.number().int().nonnegative().parse(data ?? 0);
    },
  });
}
