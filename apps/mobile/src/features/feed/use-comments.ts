import { useQuery } from "@tanstack/react-query";
import { commentSchema, type Comment } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

const COMMENTS_LIMIT = 200;

export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: ["comments", postId],
    enabled: !!postId,
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, post_id, author_id, parent_comment_id, body, created_at, updated_at, author:profiles(username, display_name, avatar_url)")
        .eq("post_id", postId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(COMMENTS_LIMIT);
      if (error) throw error;

      return (data ?? []).map((row) =>
        commentSchema.parse({
          ...row,
          author_username: row.author?.username,
          author_display_name: row.author?.display_name ?? null,
          author_avatar_url: row.author?.avatar_url ?? null,
        }),
      );
    },
  });
}
