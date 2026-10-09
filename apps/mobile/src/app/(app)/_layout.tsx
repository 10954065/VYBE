import { Stack } from 'expo-router';

import { usePushRegistration } from '@/features/notifications/use-push-registration';

export default function AppLayout() {
  usePushRegistration();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
      <Stack.Screen name="place/[id]" options={{ title: 'Place' }} />
      <Stack.Screen name="event/[id]" options={{ title: 'Event' }} />
      <Stack.Screen name="event/create" options={{ title: 'New event' }} />
      <Stack.Screen name="crew/[id]" options={{ title: 'Crew' }} />
      <Stack.Screen name="crew/create" options={{ title: 'New crew' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="profile/notification-preferences" options={{ title: 'Notifications' }} />
      <Stack.Screen name="profile/blocked-users" options={{ title: 'Blocked users' }} />
      <Stack.Screen name="profile/[id]" options={{ title: 'Profile' }} />
    </Stack>
  );
}
