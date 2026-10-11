import { useQuery } from '@tanstack/react-query';
import { inboxEntrySchema, type InboxEntry } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function inboxQueryKey(userId: string | undefined) {
  return ['inbox', userId] as const;
}

export function unreadConversationsQueryKey(userId: string | undefined) {
  return ['unread-conversations', userId] as const;
}

/** Every conversation with a message in it, newest first. Kept live by useMessagesRealtime. */
export function useInbox() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: inboxQueryKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<InboxEntry[]> => {
      const { data, error } = await supabase.rpc('get_inbox');
      if (error) throw error;
      return (data ?? []).map((row) => inboxEntrySchema.parse(row));
    },
  });
}

/** How many conversations have something unread: the badge on the messages button. */
export function useUnreadConversationCount() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: unreadConversationsQueryKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('get_unread_conversation_count');
      if (error) throw error;
      return data ?? 0;
    },
  });
}
