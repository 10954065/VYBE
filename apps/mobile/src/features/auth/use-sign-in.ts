import { useMutation } from "@tanstack/react-query";
import { signInInputSchema, type SignInInput } from "@vybe/shared";
import { supabase } from "@/lib/supabase/client";

export function useSignIn() {
  return useMutation({
    mutationFn: async (input: SignInInput) => {
      const parsed = signInInputSchema.parse(input);
      const { error } = await supabase.auth.signInWithPassword(parsed);
      if (error) throw error;
    },
  });
}
