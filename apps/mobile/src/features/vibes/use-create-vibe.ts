import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVibeInputSchema, type CreateVibeInput } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useCreateVibe() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: CreateVibeInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = createVibeInputSchema.parse(input);

      const { error } = await supabase.from("vibes").insert({
        user_id: userId,
        vibe_type: parsed.vibe_type,
        text: parsed.text,
        place_id: parsed.place_id,
        visibility: parsed.visibility,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      if (input.place_id) {
        queryClient.invalidateQueries({ queryKey: ["place-vibes", input.place_id] });
      }
    },
  });
}
