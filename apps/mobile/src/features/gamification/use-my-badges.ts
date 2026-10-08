import { useQuery } from "@tanstack/react-query";
import { earnedBadgeSchema, type EarnedBadge } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useMyBadges() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["my-badges", userId],
    enabled: !!userId,
    queryFn: async (): Promise<EarnedBadge[]> => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("awarded_at, badge:badges(*)")
        .eq("user_id", userId!)
        .order("awarded_at", { ascending: false });
      if (error) throw error;

      return (data ?? [])
        .filter((row) => row.badge !== null)
        .map((row) => earnedBadgeSchema.parse({ ...row.badge, awarded_at: row.awarded_at }));
    },
  });
}
