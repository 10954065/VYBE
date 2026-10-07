import { useQuery } from "@tanstack/react-query";
import { checkInSchema, type CheckIn } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

export function usePlaceCheckIns(placeId: string | undefined) {
  return useQuery({
    queryKey: ["place-check-ins", placeId],
    enabled: !!placeId,
    queryFn: async (): Promise<CheckIn[]> => {
      const { data, error } = await supabase
        .from("check_ins")
        .select(
          "id, user_id, place_id, event_id, note, visibility, created_at, author:profiles(username, display_name, avatar_url)",
        )
        .eq("place_id", placeId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      return (data ?? []).map((row) =>
        checkInSchema.parse({
          ...row,
          author_username: row.author?.username,
          author_display_name: row.author?.display_name ?? null,
          author_avatar_url: row.author?.avatar_url ?? null,
        }),
      );
    },
  });
}
