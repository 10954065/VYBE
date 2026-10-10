import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCrewInputSchema, type CreateCrewInput } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { track } from "@/lib/analytics/analytics";
import { useSession } from "@/lib/auth/session-provider";
import { slugify } from "@/lib/slugify";
import { supabase } from "@/lib/supabase/client";

export function useCreateCrew() {
  const { session } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: CreateCrewInput): Promise<string> => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = createCrewInputSchema.parse(input);

      const { data, error } = await supabase
        .from("crews")
        .insert({
          name: parsed.name,
          slug: slugify(parsed.name),
          description: parsed.description,
          category: parsed.category,
          city_id: profile?.city_id,
          creator_id: userId,
          privacy: parsed.privacy,
        })
        .select("id")
        .single();
      if (error) throw error;
      track("crew_created", { privacy: parsed.privacy });
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews", profile?.city_id] });
    },
  });
}
