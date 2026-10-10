import { useMutation } from "@tanstack/react-query";
import { signUpInputSchema, type SignUpInput } from "@vybe/shared";
import { identify, track } from "@/lib/analytics/analytics";
import { supabase } from "@/lib/supabase/client";

export function useSignUp() {
  return useMutation({
    mutationFn: async (input: SignUpInput) => {
      const parsed = signUpInputSchema.parse(input);
      const { data, error } = await supabase.auth.signUp(parsed);
      if (error) throw error;
      // Attribute the event now: the session listener hasn't run yet. No
      // session (email confirmation pending) means it's sent anonymously.
      if (data.session) await identify(data.session.user.id, null);
      track("signed_up");
    },
  });
}
