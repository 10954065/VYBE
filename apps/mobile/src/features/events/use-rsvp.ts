import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rsvpInputSchema, type RsvpInput } from "@vybe/shared";

import { track } from "@/lib/analytics/analytics";
import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useRsvp() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: RsvpInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = rsvpInputSchema.parse(input);

      const { error } = await supabase
        .from("event_attendees")
        .upsert(
          { event_id: parsed.event_id, user_id: userId, status: parsed.status },
          { onConflict: "event_id,user_id" },
        );
      if (error) throw error;
      track("event_rsvp", { status: parsed.status });
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["event-attendee-summary", input.event_id] });
      queryClient.invalidateQueries({ queryKey: ["home-highlight-events"] });
      queryClient.invalidateQueries({ queryKey: ["events-with-stats"] });
    },
  });
}
