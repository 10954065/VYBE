import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { z } from 'zod';

import { useProfileById } from '@/features/discovery/use-profile-by-id';
import { SnapCapture } from '@/features/snaps/snap-capture';
import type { CapturedSnap } from '@/features/snaps/snap-media';
import { SnapPreview } from '@/features/snaps/snap-preview';
import { SnapRecipientPicker } from '@/features/snaps/snap-recipient-picker';
import { useSendSnap } from '@/features/snaps/use-send-snap';
import { useSnapRecipients } from '@/features/snaps/use-snaps';
import { getErrorMessage } from '@/lib/get-error-message';

// Opened from a chat, `to` is that person: the snap goes straight to them.
const paramsSchema = z.object({ to: z.uuid().optional() });

export default function SnapCameraScreen() {
  const params = paramsSchema.safeParse(useLocalSearchParams());
  const to = params.success ? params.data.to : undefined;
  const recipient = useProfileById(to);
  const recipients = useSnapRecipients();
  const sendSnap = useSendSnap();
  const [snap, setSnap] = useState<CapturedSnap | null>(null);
  const [isChoosing, setIsChoosing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  const send = (recipientIds: string[]) => {
    if (!snap) return;
    sendSnap.mutate({ snap, recipientIds }, { onSuccess: close });
  };
  const errorMessage = sendSnap.isError ? getErrorMessage(sendSnap.error) : undefined;

  if (!snap) {
    return <SnapCapture onCaptured={setSnap} onClose={close} />;
  }

  if (isChoosing) {
    return (
      <SnapRecipientPicker
        recipients={recipients.data}
        isLoading={recipients.isLoading}
        selectedIds={selectedIds}
        onToggle={(id) =>
          setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
        }
        onBack={() => setIsChoosing(false)}
        onSend={() => send(selectedIds)}
        isSending={sendSnap.isPending}
        errorMessage={errorMessage}
      />
    );
  }

  const recipientName = recipient.data?.display_name ?? recipient.data?.username;
  return (
    <SnapPreview
      snap={snap}
      sendLabel={to ? `Send to ${recipientName?.split(' ')[0] ?? '…'}` : 'Send to…'}
      isSending={sendSnap.isPending}
      errorMessage={errorMessage}
      onRetake={() => {
        sendSnap.reset();
        setSnap(null);
      }}
      onSend={() => (to ? send([to]) : setIsChoosing(true))}
    />
  );
}
