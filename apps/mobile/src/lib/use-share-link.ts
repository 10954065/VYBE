import { useCallback } from 'react';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { buildShareLink, type ShareableEntity } from './share-link';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled';

// react-native-web's Share.share shells out to navigator.share, which most
// desktop browsers (and Playwright/headless Chromium) don't implement — it
// rejects with "Share is not supported in this browser" there. Rather than
// let that reject silently (the one existing Share.share call in this app,
// on the event highlight card, had no catch at all), fall back to copying
// the link so sharing still does something useful everywhere.
export function useShareLink() {
  return useCallback(async (entity: ShareableEntity, id: string, title: string): Promise<ShareOutcome> => {
    const url = buildShareLink(entity, id);
    try {
      const result = await Share.share({ message: `${title}\n${url}`, url, title });
      return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
    } catch {
      await Clipboard.setStringAsync(url);
      return 'copied';
    }
  }, []);
}
