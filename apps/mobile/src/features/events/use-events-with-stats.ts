import { useQuery } from "@tanstack/react-query";
import { eventWithStatsSchema, type EventWithStats } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

/** Upcoming published events in the viewer's city, with real attendee counts. */
export function useEventsWithStats() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["events-with-stats", cityId],
    enabled: !!cityId,
    queryFn: async (): Promise<EventWithStats[]> => {
      const { data, error } = await supabase.rpc("get_events_with_stats", {
        p_city_id: cityId!,
        result_limit: 50,
      });
      if (error) throw error;
      return (data ?? []).map((row) => eventWithStatsSchema.parse(row));
    },
  });
}
