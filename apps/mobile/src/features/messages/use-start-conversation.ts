import { useMutation, useQuery } from '@tanstack/react-query';
import { messageContactSchema, type MessageContact } from '@vybe/shared';

import { track } from '@/lib/analytics/analytics';
import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

/** Opens (or creates) the conversation with a person, resolving to its id. */
export function useStartConversation() {
  return useMutation({
    mutationFn: async (userId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('start_direct_conversation', { p_user: userId });
      if (error) throw error;
      track('conversation_opened', {});
      return data;
    },
  });
}

/** Whether to offer Message on someone's profile. */
export function useCanMessage(userId: string | undefined) {
  return useQuery({
    queryKey: ['can-message', userId],
    enabled: !!userId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('can_message_user', { p_user: userId! });
      if (error) throw error;
      return !!data;
    },
  });
}

/** People who can be messaged: everyone who follows the user, friends first. */
export function useMessageContacts() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['message-contacts', userId],
    enabled: !!userId,
    queryFn: async (): Promise<MessageContact[]> => {
      const { data, error } = await supabase.rpc('get_message_contacts');
      if (error) throw error;
      return (data ?? []).map((row) => messageContactSchema.parse(row));
    },
  });
}
