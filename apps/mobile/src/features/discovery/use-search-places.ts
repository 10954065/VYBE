import { useQuery } from '@tanstack/react-query';
import { searchPlaceSchema, type SearchPlace } from '@vybe/shared';

import { useProfile } from '@/features/profile/use-profile';
import { supabase } from '@/lib/supabase/client';

export function useSearchPlaces(query: string) {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search-places', cityId, trimmed],
    enabled: !!cityId && trimmed.length >= 2,
    queryFn: async (): Promise<SearchPlace[]> => {
      const { data, error } = await supabase.rpc('search_places', { p_query: trimmed, p_city_id: cityId!, result_limit: 10 });
      if (error) throw error;
      return (data ?? []).map((row) => searchPlaceSchema.parse(row));
    },
  });
}
