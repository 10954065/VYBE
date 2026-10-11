import { useQuery } from "@tanstack/react-query";
import { postMediaSchema } from "@vybe/shared";
import { z } from "zod";

import { supabase } from "@/lib/supabase/client";

const crewPostSchema = z.object({
  id: z.uuid(),
  author_id: z.uuid(),
  author_username: z.string(),
  author_display_name: z.string().nullable(),
  body: z.string().nullable(),
  created_at: z.coerce.date(),
  media: z.array(postMediaSchema),
});
export type CrewPost = z.infer<typeof crewPostSchema>;

export function useCrewPosts(crewId: string | undefined) {
  return useQuery({
    queryKey: ["crew-posts", crewId],
    enabled: !!crewId,
    queryFn: async (): Promise<CrewPost[]> => {
      const { data, error } = await supabase
        .from("posts")
        // `profiles!posts_author_id_fkey`, not bare `profiles`: posts also
        // reaches profiles many-to-many through the (currently unused)
        // saved_posts junction table, which makes an unqualified embed
        // ambiguous — PostgREST rejects it with a 300 Multiple Choices.
        .select(
          "id, author_id, body, created_at, author:profiles!posts_author_id_fkey(username, display_name), post_media(storage_path, media_type, width, height, position)",
        )
        .eq("crew_id", crewId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;

      return (data ?? []).map(({ post_media, ...row }) =>
        crewPostSchema.parse({
          ...row,
          author_username: row.author?.username,
          author_display_name: row.author?.display_name ?? null,
          media: [...post_media]
            .sort((a, b) => a.position - b.position)
            .map((item) => ({ path: item.storage_path, type: item.media_type, width: item.width, height: item.height })),
        }),
      );
    },
  });
}
