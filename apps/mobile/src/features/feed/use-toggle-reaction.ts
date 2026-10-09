import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { FeedPost } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

const REACTION_TYPE = "like";

interface ToggleReactionInput {
  postId: string;
  isReacted: boolean;
}

type FeedCache = InfiniteData<FeedPost[]>;

export function useToggleReaction() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const queryKey = ["home-feed", userId];

  return useMutation({
    mutationFn: async ({ postId, isReacted }: ToggleReactionInput) => {
      if (!userId) throw new Error("Not signed in.");

      if (isReacted) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("user_id", userId)
          .eq("post_id", postId)
          .eq("reaction_type", REACTION_TYPE);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("reactions")
          .insert({ user_id: userId, post_id: postId, reaction_type: REACTION_TYPE });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, isReacted }: ToggleReactionInput) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FeedCache>(queryKey);

      queryClient.setQueryData<FeedCache>(queryKey, (cache) => {
        if (!cache) return cache;
        return {
          ...cache,
          pages: cache.pages.map((page) =>
            page.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    viewer_has_reacted: !isReacted,
                    reaction_count: post.reaction_count + (isReacted ? -1 : 1),
                  }
                : post,
            ),
          ),
        };
      });

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData<FeedCache>(queryKey, context.previous);
      }
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["post", input.postId] });
    },
  });
}
