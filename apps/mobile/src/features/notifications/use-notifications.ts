import { useQuery } from '@tanstack/react-query';
import { notificationSchema, type Notification } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useNotifications() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        // `profiles!notifications_actor_id_fkey`, not bare `profiles`:
        // notifications has two FKs into profiles (user_id and actor_id),
        // which makes an unqualified embed ambiguous.
        .select(
          'id, user_id, actor_id, type, target_type, target_id, body, read_at, created_at, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)',
        )
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((row) => notificationSchema.parse(row));
    },
  });
}
