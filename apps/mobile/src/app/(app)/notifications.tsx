import type { Notification } from '@vybe/shared';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useMarkAllNotificationsRead } from '@/features/notifications/use-mark-all-notifications-read';
import { useMarkNotificationRead } from '@/features/notifications/use-mark-notification-read';
import { useNotifications } from '@/features/notifications/use-notifications';
import { NotificationRow } from '@/features/notifications/notification-row';
import { getErrorMessage } from '@/lib/get-error-message';

// Only navigate when the target actually resolves to a real screen — this
// project doesn't have a detail route for a lone comment, check-in, badge,
// or challenge, so those notification types are informational-only (mark
// as read, nothing to deep-link to). 'profile' now resolves for real,
// since Phase 9 added the public profile view this always needed.
function resolveNotificationHref(notification: Notification): { pathname: string; params: { id: string } } | null {
  if (!notification.target_id) return null;

  switch (notification.target_type) {
    case 'post':
      return { pathname: '/(app)/post/[id]', params: { id: notification.target_id } };
    case 'crew':
      return { pathname: '/(app)/crew/[id]', params: { id: notification.target_id } };
    case 'event':
      return { pathname: '/(app)/event/[id]', params: { id: notification.target_id } };
    case 'profile':
      return { pathname: '/(app)/profile/[id]', params: { id: notification.target_id } };
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notifications.data ?? [];
  const hasUnread = items.some((item) => !item.read_at);

  const handlePress = (notification: Notification) => {
    if (!notification.read_at) markRead.mutate(notification.id);

    const href = resolveNotificationHref(notification);
    if (href) router.push(href as never);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {hasUnread && (
          <View style={styles.header}>
            <ThemedButton title="Mark all read" variant="ghost" loading={markAllRead.isPending} onPress={() => markAllRead.mutate()} />
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={notifications.isRefetching} onRefresh={() => notifications.refetch()} />}
          renderItem={({ item }) => <NotificationRow notification={item} onPress={() => handlePress(item)} />}
          ListEmptyComponent={
            notifications.isLoading ? (
              <ActivityIndicator style={styles.emptyState} />
            ) : (
              <ThemedText type="small" style={styles.emptyState}>
                {notifications.isError ? getErrorMessage(notifications.error) : "Nothing yet — we'll let you know when something happens."}
              </ThemedText>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.four },
  listContent: { padding: Spacing.four, gap: Spacing.two, flexGrow: 1 },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
});
