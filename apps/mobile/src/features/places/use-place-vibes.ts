import { useQuery } from "@tanstack/react-query";
import { vibeSchema, type Vibe } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

export function usePlaceVibes(placeId: string | undefined) {
  return useQuery({
    queryKey: ["place-vibes", placeId],
    enabled: !!placeId,
    queryFn: async (): Promise<Vibe[]> => {
      const { data, error } = await supabase
        .from("vibes")
        .select(
          "id, user_id, vibe_type, text, place_id, visibility, expires_at, created_at, author:profiles(username, display_name, avatar_url)",
        )
        .eq("place_id", placeId!)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;

      return (data ?? []).map((row) =>
        vibeSchema.parse({
          ...row,
          author_username: row.author?.username,
          author_display_name: row.author?.display_name ?? null,
          author_avatar_url: row.author?.avatar_url ?? null,
        }),
      );
    },
  });
}
