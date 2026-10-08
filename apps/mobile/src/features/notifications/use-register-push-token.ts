import { useMutation } from '@tanstack/react-query';
import type { RegisterPushTokenInput } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useRegisterPushToken() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async ({ token, platform }: RegisterPushTokenInput) => {
      if (!userId) throw new Error('Not signed in.');
      const { error } = await supabase.from('push_tokens').upsert({ user_id: userId, token, platform }, { onConflict: 'token' });
      if (error) throw error;
    },
  });
}
