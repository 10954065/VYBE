import { useQuery } from '@tanstack/react-query';
import { notificationPreferencesSchema, type NotificationPreferences } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useNotificationPreferences() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['notification-preferences', userId],
    enabled: !!userId,
    queryFn: async (): Promise<NotificationPreferences> => {
      const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', userId!).single();
      if (error) throw error;
      return notificationPreferencesSchema.parse(data);
    },
  });
}
