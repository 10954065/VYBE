import { useQuery } from "@tanstack/react-query";
import { challengeWithParticipationSchema, type ChallengeWithParticipation } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

/** The city's single soonest-ending active challenge, with the viewer's own participation row if they've joined. */
export function useActiveChallenge() {
  const { data: profile } = useProfile();
  const { session } = useSession();
  const cityId = profile?.city_id;
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["active-challenge", cityId, userId],
    enabled: !!cityId && !!userId,
    queryFn: async (): Promise<ChallengeWithParticipation | null> => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*, challenge_participants(progress, completed_at, joined_at)")
        .eq("city_id", cityId!)
        .eq("status", "active")
        .gte("end_at", new Date().toISOString())
        .eq("challenge_participants.user_id", userId!)
        .order("end_at", { ascending: true })
        .limit(1);
      if (error) throw error;

      const row = data?.[0];
      if (!row) return null;

      const participation = row.challenge_participants?.[0];
      return challengeWithParticipationSchema.parse({
        ...row,
        progress: participation?.progress ?? null,
        completed_at: participation?.completed_at ?? null,
        joined_at: participation?.joined_at ?? null,
      });
    },
  });
}
