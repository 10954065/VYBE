import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useUnreadNotificationCount() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['unread-notification-count', userId],
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
