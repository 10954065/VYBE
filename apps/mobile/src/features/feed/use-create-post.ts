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
        crew_id: parsed.crew_id,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["home-feed", userId] });
      if (input.crew_id) {
        queryClient.invalidateQueries({ queryKey: ["crew-posts", input.crew_id] });
      }
    },
  });
}
