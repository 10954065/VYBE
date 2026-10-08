import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useUnreadNotificationCount } from '@/features/notifications/use-unread-notification-count';

export function NotificationBell() {
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={8}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}>
      <ThemedText style={styles.icon}>🔔</ThemedText>
      {!!unreadCount && (
        <View style={styles.badge}>
          <ThemedText type="small" style={styles.badgeLabel}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.secondaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeLabel: { fontSize: 10, lineHeight: 12, color: Colors.onPrimary },
});
