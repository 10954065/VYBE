import { useQuery } from "@tanstack/react-query";
import { eventSchema, type Event } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

export function usePlaceEvents(placeId: string | undefined) {
  return useQuery({
    queryKey: ["place-events", placeId],
    enabled: !!placeId,
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("place_id", placeId!)
        .eq("status", "published")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map((row) => eventSchema.parse(row));
    },
  });
}
