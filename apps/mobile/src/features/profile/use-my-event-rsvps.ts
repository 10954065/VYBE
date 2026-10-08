import { useQuery } from "@tanstack/react-query";
import { eventListItemSchema, type EventListItem } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

/** Upcoming events the viewer has RSVP'd to (interested/going/checked_in). */
export function useMyEventRsvps() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-event-rsvps", userId],
    enabled: !!userId,
    queryFn: async (): Promise<EventListItem[]> => {
      const { data, error } = await supabase
        .from("event_attendees")
        .select("status, event:events(*, place:places(name))")
        .eq("user_id", userId!)
        .in("status", ["interested", "going", "checked_in"])
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data ?? [])
        .filter((row) => row.event !== null)
        .map((row) => eventListItemSchema.parse({ ...row.event, place_name: row.event?.place?.name ?? null }));
    },
  });
}
