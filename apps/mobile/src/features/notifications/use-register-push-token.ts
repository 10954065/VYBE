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
      // An RPC rather than an upsert: the token may still belong to the last
      // account signed in on this phone, whose row RLS won't let us touch.
      const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: platform });
      if (error) throw error;
    },
  });
}
