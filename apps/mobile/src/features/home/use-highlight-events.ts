import { useQuery } from "@tanstack/react-query";
import { homeHighlightEventSchema, type HomeHighlightEvent } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

/** Events starting in the next 18 hours in the viewer's city ("Happening Tonight"). */
export function useHighlightEvents() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["home-highlight-events", cityId],
    enabled: !!cityId,
    queryFn: async (): Promise<HomeHighlightEvent[]> => {
      const { data, error } = await supabase.rpc("get_home_highlight_events", {
        p_city_id: cityId!,
        result_limit: 5,
      });
      if (error) throw error;
      return (data ?? []).map((row) => homeHighlightEventSchema.parse(row));
    },
  });
}
