import { useQuery } from '@tanstack/react-query';
import { searchPersonSchema, type SearchPerson } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useSearchPeople(query: string) {
  const { session } = useSession();
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search-people', trimmed],
    enabled: !!session && trimmed.length >= 2,
    queryFn: async (): Promise<SearchPerson[]> => {
      const { data, error } = await supabase.rpc('search_people', { p_query: trimmed, result_limit: 10 });
      if (error) throw error;
      return (data ?? []).map((row) => searchPersonSchema.parse(row));
    },
  });
}
