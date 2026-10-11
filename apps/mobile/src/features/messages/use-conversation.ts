import { useQuery } from '@tanstack/react-query';
import { conversationSchema, type Conversation } from '@vybe/shared';

import { supabase } from '@/lib/supabase/client';

export function conversationQueryKey(conversationId: string | undefined) {
  return ['conversation', conversationId] as const;
}

/**
 * The conversation row: who's in it and how far each side has read.
 * Null when it doesn't exist or the caller can't see it (not a member,
 * or blocked). useMessagesRealtime keeps it current.
 */
export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationQueryKey(conversationId),
    enabled: !!conversationId,
    queryFn: async (): Promise<Conversation | null> => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, user_a, user_b, created_at, last_message_at, user_a_read_at, user_b_read_at, streak_day, streak_count')
        .eq('id', conversationId!)
        .maybeSingle();
      if (error) throw error;
      return data ? conversationSchema.parse(data) : null;
    },
  });
}
