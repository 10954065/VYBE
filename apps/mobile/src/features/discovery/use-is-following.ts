import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useIsFollowing(targetId: string | undefined) {
  const { session } = useSession();
  const viewerId = session?.user.id;

  return useQuery({
    queryKey: ['is-following', viewerId, targetId],
    enabled: !!viewerId && !!targetId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', viewerId!)
        .eq('following_id', targetId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}
