import { useQuery } from '@tanstack/react-query';
import { searchEventSchema, type SearchEvent } from '@vybe/shared';

import { useProfile } from '@/features/profile/use-profile';
import { supabase } from '@/lib/supabase/client';

export function useSearchEvents(query: string) {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search-events', cityId, trimmed],
    enabled: !!cityId && trimmed.length >= 2,
    queryFn: async (): Promise<SearchEvent[]> => {
      const { data, error } = await supabase.rpc('search_events', { p_query: trimmed, p_city_id: cityId!, result_limit: 10 });
      if (error) throw error;
      return (data ?? []).map((row) => searchEventSchema.parse(row));
    },
  });
}
