import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommentInputSchema, type CreateCommentInput } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useAddComment() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      if (!userId) throw new Error("Not signed in.");
      const parsed = createCommentInputSchema.parse(input);

      const { error } = await supabase.from("comments").insert({
        post_id: parsed.post_id,
        author_id: userId,
        parent_comment_id: parsed.parent_comment_id,
        body: parsed.body,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["comments", input.post_id] });
      queryClient.invalidateQueries({ queryKey: ["home-feed", userId] });
    },
  });
}
