import { useQuery } from '@tanstack/react-query';
import { recommendedPlaceSchema, type RecommendedPlace } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useRecommendedPlaces(enabled: boolean) {
  const { session } = useSession();

  return useQuery({
    queryKey: ['recommended-places', session?.user.id],
    enabled: !!session && enabled,
    queryFn: async (): Promise<RecommendedPlace[]> => {
      const { data, error } = await supabase.rpc('get_recommended_places', { result_limit: 20 });
      if (error) throw error;
      return (data ?? []).map((row) => recommendedPlaceSchema.parse(row));
    },
  });
}
