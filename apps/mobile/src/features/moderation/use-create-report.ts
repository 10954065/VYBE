import { useMutation } from "@tanstack/react-query";
import { createReportInputSchema, type CreateReportInput } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useCreateReport() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = createReportInputSchema.parse(input);

      const { error } = await supabase.from("reports").insert({
        reporter_id: userId,
        target_type: parsed.target_type,
        target_id: parsed.target_id,
        category: parsed.category,
        details: parsed.details,
      });
      if (error) throw error;
    },
  });
}
