import { useQueryClient } from '@tanstack/react-query';
import { conversationSchema, messageSchema } from '@vybe/shared';
import { useEffect } from 'react';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

import { messagesQueryKey, withMessage, type MessagePages } from './message-cache';
import { conversationQueryKey } from './use-conversation';
import { inboxQueryKey, unreadConversationsQueryKey } from './use-inbox';

/**
 * One Realtime subscription for the signed-in user's messages, mounted
 * once for the whole app. Realtime only delivers rows the user's RLS lets
 * them read, so this hears exactly their own conversations: new messages
 * go straight into an open chat, opened snaps update in place, and read
 * receipts and streaks (a conversation row update) reach its header. The
 * inbox and the badge refetch.
 */
export function useMessagesRealtime() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;

    const refreshInbox = () => {
      queryClient.invalidateQueries({ queryKey: inboxQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: unreadConversationsQueryKey(userId) });
    };

    const channel = supabase
      .channel(`messages:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const parsed = messageSchema.safeParse(payload.new);
        if (parsed.success) {
          queryClient.setQueryData<MessagePages>(messagesQueryKey(parsed.data.conversation_id), (data) =>
            withMessage(data, parsed.data),
          );
        }
        refreshInbox();
      })
      // A snap being opened: the sender's "Delivered" becomes "Opened".
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const parsed = messageSchema.safeParse(payload.new);
        if (parsed.success) {
          queryClient.setQueryData<MessagePages>(messagesQueryKey(parsed.data.conversation_id), (data) =>
            withMessage(data, parsed.data),
          );
        }
        refreshInbox();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload) => {
        const parsed = conversationSchema.safeParse(payload.new);
        if (parsed.success) {
          queryClient.setQueryData(conversationQueryKey(parsed.data.id), parsed.data);
        }
        refreshInbox();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
