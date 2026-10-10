import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboardingInputSchema, type CompleteOnboardingInput } from "@vybe/shared";
import { track } from "@/lib/analytics/analytics";
import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useCompleteOnboarding() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: CompleteOnboardingInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = completeOnboardingInputSchema.parse(input);

      const { error } = await supabase.rpc("complete_onboarding", {
        p_username: parsed.username,
        p_display_name: parsed.display_name,
        p_city_id: parsed.city_id,
        p_avatar_url: (parsed.avatar_url ?? null) as string,
        p_interests: parsed.interests,
        p_genres: parsed.genres,
        p_neighborhoods: parsed.neighborhoods,
        p_travel_radius: parsed.travel_radius,
        p_nightlife_pace: parsed.nightlife_pace,
        p_crew_preference: parsed.crew_preference,
        p_default_check_in_visibility: parsed.default_check_in_visibility,
      });
      if (error) throw error;
      track("onboarding_completed", { genre_count: parsed.genres.length, neighborhood_count: parsed.neighborhoods.length });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}
