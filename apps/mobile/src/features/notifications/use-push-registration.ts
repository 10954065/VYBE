import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useRegisterPushToken } from '@/features/notifications/use-register-push-token';
import { useSession } from '@/lib/auth/session-provider';

/**
 * Registers this device's Expo push token once per signed-in session. The
 * backend side (push_tokens, send_push_notification) is fully real — see
 * docs/notifications.md — but minting a token needs an EAS project id
 * (`Constants.expoConfig.extra.eas.projectId`), which this app doesn't have
 * configured yet (no `eas init` has been run, and that needs a real Expo
 * account — not something to set up unilaterally). Without it, this hook is
 * a documented no-op: the rest of the app works exactly the same, just
 * without push delivery.
 */
export function usePushRegistration() {
  const { session } = useSession();
  const { mutate: registerPushToken } = useRegisterPushToken();

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId || Platform.OS === 'web') return;

    let isCancelled = false;

    async function register() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted' || isCancelled) return;

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      if (isCancelled) return;

      registerPushToken({ token, platform: Platform.OS === 'ios' ? 'ios' : 'android' });
    }

    register().catch(() => {
      // Permission denial or a transient push-service error — the app
      // works fully without a token, just without push delivery.
    });

    return () => {
      isCancelled = true;
    };
  }, [session?.user.id, registerPushToken]);
}
