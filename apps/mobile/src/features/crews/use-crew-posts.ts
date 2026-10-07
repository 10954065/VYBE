import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/lib/supabase/client";

const crewPostSchema = z.object({
  id: z.uuid(),
  author_id: z.uuid(),
  author_username: z.string(),
  author_display_name: z.string().nullable(),
  body: z.string().nullable(),
  created_at: z.coerce.date(),
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
        .select("id, author_id, body, created_at, author:profiles!posts_author_id_fkey(username, display_name)")
        .eq("crew_id", crewId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;

      return (data ?? []).map((row) =>
        crewPostSchema.parse({
          ...row,
          author_username: row.author?.username,
          author_display_name: row.author?.display_name ?? null,
        }),
      );
    },
  });
}
