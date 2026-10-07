import { useMutation } from "@tanstack/react-query";
import { requestPasswordResetInputSchema, type RequestPasswordResetInput } from "@vybe/shared";
import { supabase } from "@/lib/supabase/client";

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (input: RequestPasswordResetInput) => {
      const parsed = requestPasswordResetInputSchema.parse(input);
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.email);
      if (error) throw error;
    },
  });
}
