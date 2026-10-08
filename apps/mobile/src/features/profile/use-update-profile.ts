import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfileInputSchema, type UpdateProfileInput } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useUpdateProfile() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = updateProfileInputSchema.parse(input);

      const { error } = await supabase.from("profiles").update(parsed).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}
