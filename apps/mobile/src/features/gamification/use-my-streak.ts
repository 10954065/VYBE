import { useQuery } from "@tanstack/react-query";
import { streakSchema, type Streak } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

/** The viewer's own 'outside' streak — the only streak_type the engine computes today. */
export function useMyOutsideStreak() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-outside-streak", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Streak | null> => {
      const { data, error } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", userId!)
        .eq("streak_type", "outside")
        .maybeSingle();
      if (error) throw error;
      return data ? streakSchema.parse(data) : null;
    },
  });
}
