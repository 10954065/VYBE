import { useQuery } from '@tanstack/react-query';
import { profileSchema, type ProfileRow } from '@vybe/shared';

import { supabase } from '@/lib/supabase/client';

export function useProfileById(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile-by-id', profileId],
    enabled: !!profileId,
    queryFn: async (): Promise<ProfileRow> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', profileId!).single();
      if (error) throw error;
      return profileSchema.parse(data);
    },
  });
}
