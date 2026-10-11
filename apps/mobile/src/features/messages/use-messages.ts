import { useInfiniteQuery } from '@tanstack/react-query';
import { messageSchema } from '@vybe/shared';

import { supabase } from '@/lib/supabase/client';

import { messagesQueryKey, type ChatMessage } from './message-cache';

const PAGE_SIZE = 50;

type PageParam = { createdAt: string; id: string } | null;

/** A conversation's messages, newest first, older pages loaded on scroll. */
export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: messagesQueryKey(conversationId),
    enabled: !!conversationId,
    initialPageParam: null as PageParam,
    queryFn: async ({ pageParam }): Promise<ChatMessage[]> => {
      const { data, error } = await supabase.rpc('get_messages', {
        p_conversation: conversationId!,
        page_size: PAGE_SIZE,
        before_created_at: pageParam?.createdAt,
        before_id: pageParam?.id,
      });
      if (error) throw error;
      return (data ?? []).map((row) => messageSchema.parse(row));
    },
    getNextPageParam: (lastPage): PageParam => {
      if (lastPage.length < PAGE_SIZE) return null;
      const last = lastPage[lastPage.length - 1];
      return { createdAt: last.created_at.toISOString(), id: last.id };
    },
  });
}
