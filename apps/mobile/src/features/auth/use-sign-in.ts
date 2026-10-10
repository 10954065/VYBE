import { useMutation } from "@tanstack/react-query";
import { signInInputSchema, type SignInInput } from "@vybe/shared";
import { identify, track } from "@/lib/analytics/analytics";
import { supabase } from "@/lib/supabase/client";

export function useSignIn() {
  return useMutation({
    mutationFn: async (input: SignInInput) => {
      const parsed = signInInputSchema.parse(input);
      const { data, error } = await supabase.auth.signInWithPassword(parsed);
      if (error) throw error;
      // Attribute the event now: the session listener hasn't run yet.
      await identify(data.user.id, null);
      track("signed_in");
    },
  });
}
