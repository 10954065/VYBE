import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPostInputSchema, type CreatePostInput } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useCreatePost() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = createPostInputSchema.parse(input);

      const { error } = await supabase.from("posts").insert({
        author_id: userId,
        kind: "text",
        body: parsed.body,
        visibility: parsed.visibility,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-feed", userId] });
    },
  });
}
