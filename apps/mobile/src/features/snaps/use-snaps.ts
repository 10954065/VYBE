import { useMutation, useQuery } from '@tanstack/react-query';
import { messageSchema, SNAPS_BUCKET, snapRecipientSchema, type Message, type SnapRecipient } from '@vybe/shared';

import { track } from '@/lib/analytics/analytics';
import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

// The database lets a recipient load a snap for two minutes after opening
// it; the link doesn't need to outlive that.
const SNAP_URL_TTL_SECONDS = 120;

/** Friends to send a snap to, longest streaks first. */
export function useSnapRecipients() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['snap-recipients', userId],
    enabled: !!userId,
    queryFn: async (): Promise<SnapRecipient[]> => {
      const { data, error } = await supabase.rpc('get_snap_recipients');
      if (error) throw error;
      return (data ?? []).map((row) => snapRecipientSchema.parse(row));
    },
  });
}

/** A snap message, if the caller can see it (they're in its conversation). */
export function useSnapMessage(messageId: string | undefined) {
  return useQuery({
    queryKey: ['snap-message', messageId],
    enabled: !!messageId,
    queryFn: async (): Promise<Message | null> => {
      const { data, error } = await supabase.from('messages').select('*').eq('id', messageId!).maybeSingle();
      if (error) throw error;
      return data ? messageSchema.parse(data) : null;
    },
  });
}

/**
 * Opens a snap: records it as opened (which is what lets the recipient
 * read the file at all), then signs a link to it. Only works once; after
 * the two-minute window the database refuses (snap_already_opened).
 */
export function useOpenSnap() {
  return useMutation({
    mutationFn: async (snap: Message): Promise<string> => {
      const { error } = await supabase.rpc('open_snap', { p_message: snap.id });
      if (error) throw error;
      const { data, error: signError } = await supabase.storage
        .from(SNAPS_BUCKET)
        .createSignedUrl(snap.media_path!, SNAP_URL_TTL_SECONDS);
      if (signError) throw signError;
      if (snap.media_type) track('snap_opened', { kind: snap.media_type });
      return data.signedUrl;
    },
  });
}
