import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

import { inboxQueryKey, unreadConversationsQueryKey } from './use-inbox';

export function useMarkConversationRead() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase.rpc('mark_conversation_read', { p_conversation: conversationId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: unreadConversationsQueryKey(userId) });
    },
  });
}
