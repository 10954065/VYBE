import { useQuery } from "@tanstack/react-query";
import { attendeeSummarySchema, type AttendeeSummary } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

export function useAttendeeSummary(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-attendee-summary", eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<AttendeeSummary> => {
      const { data, error } = await supabase.rpc("get_event_attendee_summary", {
        target_event_id: eventId!,
      });
      if (error) throw error;
      return attendeeSummarySchema.parse(
        data?.[0] ?? { interested_count: 0, going_count: 0, checked_in_count: 0, viewer_status: null },
      );
    },
  });
}
