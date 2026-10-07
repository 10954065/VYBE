import { useMutation } from "@tanstack/react-query";
import { signUpInputSchema, type SignUpInput } from "@vybe/shared";
import { supabase } from "@/lib/supabase/client";

export function useSignUp() {
  return useMutation({
    mutationFn: async (input: SignUpInput) => {
      const parsed = signUpInputSchema.parse(input);
      const { error } = await supabase.auth.signUp(parsed);
      if (error) throw error;
    },
  });
}
