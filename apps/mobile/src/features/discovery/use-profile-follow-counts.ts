import { useQuery } from '@tanstack/react-query';
import { profileFollowCountsSchema, type ProfileFollowCounts } from '@vybe/shared';

import { supabase } from '@/lib/supabase/client';

export function useProfileFollowCounts(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile-follow-counts', profileId],
    enabled: !!profileId,
    queryFn: async (): Promise<ProfileFollowCounts> => {
      const { data, error } = await supabase.rpc('get_profile_follow_counts', { p_profile_id: profileId! }).single();
      if (error) throw error;
      return profileFollowCountsSchema.parse(data);
    },
  });
}
