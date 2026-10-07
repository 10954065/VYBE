import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboardingInputSchema, type CompleteOnboardingInput } from "@vybe/shared";
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

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: parsed.username,
          display_name: parsed.display_name,
          city_id: parsed.city_id,
          avatar_url: parsed.avatar_url,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (profileError) throw profileError;

      const { error: clearInterestsError } = await supabase.from("user_interests").delete().eq("user_id", userId);
      if (clearInterestsError) throw clearInterestsError;

      const { error: interestsError } = await supabase
        .from("user_interests")
        .insert(parsed.interests.map((interest) => ({ user_id: userId, interest })));
      if (interestsError) throw interestsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}
