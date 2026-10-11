import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SNAP_MAX_RECIPIENTS, SNAPS_BUCKET } from '@vybe/shared';

import { inboxQueryKey } from '@/features/messages/use-inbox';
import { track } from '@/lib/analytics/analytics';
import { useSession } from '@/lib/auth/session-provider';
import { preparePhoto } from '@/lib/media/photo';
import { randomFileName, removeFiles, uploadFile } from '@/lib/media/storage';
import { supabase } from '@/lib/supabase/client';

import { snapFileFormat, SNAP_PHOTO_MAX_EDGE, type CapturedSnap } from './snap-media';

export interface SendSnapVariables {
  snap: CapturedSnap;
  recipientIds: string[];
}

/**
 * Uploads a snap once and sends it to each recipient (send_snap: one
 * message per person, all or nothing). Photos are resized and re-encoded
 * like every other photo, which strips their location data; videos go as
 * recorded.
 */
export function useSendSnap() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async ({ snap, recipientIds }: SendSnapVariables): Promise<number> => {
      if (!userId) throw new Error('Not signed in.');
      if (recipientIds.length === 0) throw new Error('Choose who to send it to.');
      if (recipientIds.length > SNAP_MAX_RECIPIENTS) throw new Error(`Up to ${SNAP_MAX_RECIPIENTS} people at a time.`);

      let file = snap;
      if (snap.type === 'image' && snap.width && snap.height) {
        const prepared = await preparePhoto({ uri: snap.uri, width: snap.width, height: snap.height }, SNAP_PHOTO_MAX_EDGE);
        file = { ...snap, ...prepared };
      }

      const { extension, contentType } = snapFileFormat(file);
      const path = `${userId}/${randomFileName(extension)}`;
      await uploadFile(SNAPS_BUCKET, path, file.uri, contentType);

      try {
        const { data, error } = await supabase.rpc('send_snap', {
          p_recipients: recipientIds,
          p_media_path: path,
          p_media_type: snap.type,
          p_width: file.width ?? undefined,
          p_height: file.height ?? undefined,
          p_duration_ms: file.durationMs ?? undefined,
        });
        if (error) throw error;
        track('snap_sent', { kind: snap.type, recipient_count: recipientIds.length });
        return data;
      } catch (error) {
        // Best effort: the error worth showing is the one that stopped the snap.
        await removeFiles(SNAPS_BUCKET, [path]).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: ['snap-recipients', userId] });
    },
  });
}
