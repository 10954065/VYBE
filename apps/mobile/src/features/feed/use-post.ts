import { useQuery } from "@tanstack/react-query";
import { feedPostSchema, type FeedPost } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

// Unlike useHomeFeed (scoped to the follow graph), this resolves a post by
// id regardless of who the viewer follows — needed for deep links, shares,
// and notification taps that may land on a post from someone the viewer
// doesn't follow yet but is still allowed to see per the post's own
// visibility. Returns null (not an error, and not undefined — TanStack
// Query reserves a queryFn resolving to undefined for internal use) when
// RLS hides the post or it doesn't exist, so callers can render a "not
// available" state.
export function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: ["post", postId],
    enabled: !!postId,
    queryFn: async (): Promise<FeedPost | null> => {
      const { data, error } = await supabase.rpc("get_post_by_id", { p_post_id: postId! });
      if (error) throw error;
      const row = data?.[0];
      return row ? feedPostSchema.parse(row) : null;
    },
  });
}
