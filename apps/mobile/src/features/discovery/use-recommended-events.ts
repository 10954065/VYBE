import { useQuery } from '@tanstack/react-query';
import { recommendedEventSchema, type RecommendedEvent } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useRecommendedEvents(enabled: boolean) {
  const { session } = useSession();

  return useQuery({
    queryKey: ['recommended-events', session?.user.id],
    enabled: !!session && enabled,
    queryFn: async (): Promise<RecommendedEvent[]> => {
      const { data, error } = await supabase.rpc('get_recommended_events', { result_limit: 20 });
      if (error) throw error;
      return (data ?? []).map((row) => recommendedEventSchema.parse(row));
    },
  });
}
