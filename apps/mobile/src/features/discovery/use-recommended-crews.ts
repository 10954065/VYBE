import { useQuery } from '@tanstack/react-query';
import { recommendedCrewSchema, type RecommendedCrew } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useRecommendedCrews(enabled: boolean) {
  const { session } = useSession();

  return useQuery({
    queryKey: ['recommended-crews', session?.user.id],
    enabled: !!session && enabled,
    queryFn: async (): Promise<RecommendedCrew[]> => {
      const { data, error } = await supabase.rpc('get_recommended_crews', { result_limit: 20 });
      if (error) throw error;
      return (data ?? []).map((row) => recommendedCrewSchema.parse(row));
    },
  });
}
