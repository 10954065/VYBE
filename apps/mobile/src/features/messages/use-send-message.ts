import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CHAT_MEDIA_BUCKET, messageSchema, sendMessageInputSchema, type Message } from '@vybe/shared';

import { track } from '@/lib/analytics/analytics';
import { useSession } from '@/lib/auth/session-provider';
import { preparePhoto, type LocalPhoto } from '@/lib/media/photo';
import { randomFileName, removeFiles, uploadFile } from '@/lib/media/storage';
import { supabase } from '@/lib/supabase/client';

import { messagesQueryKey, withMessage, withoutMessage, type MessagePages } from './message-cache';
import { inboxQueryKey } from './use-inbox';

export interface SendMessageVariables {
  /** Chosen by the caller (randomUuid) so the message can show before the server has it. */
  id: string;
  conversationId: string;
  body?: string;
  photo?: LocalPhoto;
}

export function useSendMessage() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async ({ id, conversationId, body, photo }: SendMessageVariables): Promise<Message> => {
      if (!userId) throw new Error('Not signed in.');

      let uploaded: { path: string; width: number; height: number } | undefined;
      if (photo) {
        const prepared = await preparePhoto(photo);
        const path = `${userId}/${randomFileName('jpg')}`;
        await uploadFile(CHAT_MEDIA_BUCKET, path, prepared.uri, 'image/jpeg');
        uploaded = { path, width: prepared.width, height: prepared.height };
      }

      try {
        const parsed = sendMessageInputSchema.parse({
          conversation_id: conversationId,
          body: body || undefined,
          photo: uploaded,
        });
        const { data, error } = await supabase
          .from('messages')
          .insert({
            id,
            conversation_id: parsed.conversation_id,
            sender_id: userId,
            kind: parsed.photo ? 'photo' : 'text',
            body: parsed.body ?? null,
            media_path: parsed.photo?.path ?? null,
            media_width: parsed.photo?.width ?? null,
            media_height: parsed.photo?.height ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        track('message_sent', { kind: parsed.photo ? 'photo' : 'text' });
        return messageSchema.parse(data);
      } catch (error) {
        // Best effort: the error worth showing is the one that stopped the message.
        if (uploaded) await removeFiles(CHAT_MEDIA_BUCKET, [uploaded.path]).catch(() => undefined);
        throw error;
      }
    },
    // Text shows straight away; a photo waits for its upload.
    onMutate: ({ id, conversationId, body, photo }) => {
      if (!userId || photo || !body) return;
      queryClient.setQueryData<MessagePages>(messagesQueryKey(conversationId), (data) =>
        withMessage(data, {
          id,
          conversation_id: conversationId,
          sender_id: userId,
          kind: 'text',
          body,
          media_path: null,
          media_width: null,
          media_height: null,
          created_at: new Date(),
          isPending: true,
        }),
      );
    },
    onSuccess: (message) => {
      queryClient.setQueryData<MessagePages>(messagesQueryKey(message.conversation_id), (data) =>
        withMessage(data, message),
      );
      queryClient.invalidateQueries({ queryKey: inboxQueryKey(userId) });
    },
    onError: (_error, { id, conversationId }) => {
      queryClient.setQueryData<MessagePages>(messagesQueryKey(conversationId), (data) => withoutMessage(data, id));
    },
  });
}
