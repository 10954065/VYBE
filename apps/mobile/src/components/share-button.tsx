import { useState } from 'react';

import { ThemedButton } from '@/components/themed-button';
import type { ShareableEntity } from '@/lib/share-link';
import { useShareLink } from '@/lib/use-share-link';

interface ShareButtonProps {
  entity: ShareableEntity;
  id: string;
  title: string;
}

const COPIED_FEEDBACK_MS = 2000;

export function ShareButton({ entity, id, title }: ShareButtonProps) {
  const shareLink = useShareLink();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePress = async () => {
    const outcome = await shareLink(entity, id, title);
    if (outcome === 'copied') {
      setFeedback('Link copied!');
      setTimeout(() => setFeedback(null), COPIED_FEEDBACK_MS);
    }
  };

  return <ThemedButton title={feedback ?? 'Share'} variant="ghost" onPress={handlePress} />;
}
