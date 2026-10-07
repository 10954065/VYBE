import { useQuery } from "@tanstack/react-query";
import { eventListItemSchema, type EventListItem } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

export function useEvents() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["events", cityId],
    enabled: !!cityId,
    queryFn: async (): Promise<EventListItem[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*, place:places(name)")
        .eq("city_id", cityId!)
        .eq("status", "published")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(50);
      if (error) throw error;

      return (data ?? []).map((row) =>
        eventListItemSchema.parse({ ...row, place_name: row.place?.name ?? null }),
      );
    },
  });
}
