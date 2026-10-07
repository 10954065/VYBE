import { useQuery } from "@tanstack/react-query";
import { eventListItemSchema, type EventListItem } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<EventListItem> => {
      const { data, error } = await supabase
        .from("events")
        .select("*, place:places(name)")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return eventListItemSchema.parse({ ...data, place_name: data.place?.name ?? null });
    },
  });
}
