import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CHECK_IN_RATE_LIMITED_MESSAGE,
  CHECK_IN_RATE_LIMIT_SECONDS,
  createCheckInInputSchema,
  type CreateCheckInInput,
} from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useCreateCheckIn() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: CreateCheckInInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = createCheckInInputSchema.parse(input);

      const { error } = await supabase.from("check_ins").insert({
        user_id: userId,
        place_id: parsed.place_id,
        event_id: parsed.event_id,
        note: parsed.note,
        visibility: parsed.visibility,
      });
      if (error) {
        if (error.message.includes(CHECK_IN_RATE_LIMITED_MESSAGE)) {
          throw new Error(`You can only check in once every ${CHECK_IN_RATE_LIMIT_SECONDS} seconds. Try again shortly.`);
        }
        throw error;
      }
    },
    onSuccess: (_data, input) => {
      if (input.place_id) {
        queryClient.invalidateQueries({ queryKey: ["place-check-ins", input.place_id] });
      }
      if (input.event_id) {
        queryClient.invalidateQueries({ queryKey: ["event-attendee-summary", input.event_id] });
      }
    },
  });
}
