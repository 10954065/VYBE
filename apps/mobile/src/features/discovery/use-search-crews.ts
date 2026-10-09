import { useQuery } from '@tanstack/react-query';
import { searchCrewSchema, type SearchCrew } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useSearchCrews(query: string) {
  const { session } = useSession();
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search-crews', trimmed],
    enabled: !!session && trimmed.length >= 2,
    queryFn: async (): Promise<SearchCrew[]> => {
      const { data, error } = await supabase.rpc('search_crews', { p_query: trimmed, result_limit: 10 });
      if (error) throw error;
      return (data ?? []).map((row) => searchCrewSchema.parse(row));
    },
  });
}
