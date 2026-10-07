import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventInputSchema, type CreateEventInput } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { useSession } from "@/lib/auth/session-provider";
import { slugify } from "@/lib/slugify";
import { supabase } from "@/lib/supabase/client";

export function useCreateEvent() {
  const { session } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = createEventInputSchema.parse(input);

      const { error } = await supabase.from("events").insert({
        title: parsed.title,
        slug: slugify(parsed.title),
        description: parsed.description,
        category: parsed.category,
        place_id: parsed.place_id,
        city_id: profile?.city_id,
        organizer_id: userId,
        start_at: parsed.start_at.toISOString(),
        end_at: parsed.end_at?.toISOString(),
        capacity: parsed.capacity,
        visibility: parsed.visibility,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", profile?.city_id] });
    },
  });
}
