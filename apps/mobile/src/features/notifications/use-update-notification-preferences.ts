import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateNotificationPreferencesInput } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useUpdateNotificationPreferences() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (input: UpdateNotificationPreferencesInput) => {
      if (!userId) throw new Error('Not signed in.');
      const { error } = await supabase.from('notification_preferences').update(input).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
    },
  });
}
