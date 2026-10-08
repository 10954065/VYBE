import { NOTIFICATION_ICONS, type Notification } from '@vybe/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/format-relative-time';

interface NotificationRowProps {
  notification: Notification;
  onPress: () => void;
}

function notificationTitle(notification: Notification): string {
  const actorName = notification.actor?.display_name ?? notification.actor?.username ?? 'Someone';

  switch (notification.type) {
    case 'follow':
      return `${actorName} started following you`;
    case 'like':
      return `${actorName} reacted to your ${notification.target_type ?? 'post'}`;
    case 'comment':
      return `${actorName} commented on your post`;
    case 'crew_activity':
      return notification.body ?? 'Crew activity';
    case 'event_reminder':
      return notification.body ?? 'An event is starting soon';
    case 'challenge_completed':
      return notification.body ? `Completed: ${notification.body}` : 'Challenge completed';
    case 'streak_milestone':
      return notification.body ?? 'Streak milestone';
    case 'xp_milestone':
      return notification.body ?? 'Level up!';
    case 'badge_earned':
      return notification.body ? `Badge earned: ${notification.body}` : 'Badge earned';
    case 'recommendation':
      return notification.body ?? 'New recommendation';
  }
}

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const isUnread = !notification.read_at;

  return (
    <Pressable onPress={onPress} style={[styles.row, isUnread && styles.unread]}>
      <ThemedText style={styles.icon}>{NOTIFICATION_ICONS[notification.type]}</ThemedText>
      <View style={styles.body}>
        <ThemedText type={isUnread ? 'smallBold' : 'small'}>{notificationTitle(notification)}</ThemedText>
        {notification.type === 'comment' && !!notification.body && (
          <ThemedText type="small" themeColor="textSecondary">
            “{notification.body}”
          </ThemedText>
        )}
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeTime(notification.created_at)}
        </ThemedText>
      </View>
      {isUnread && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Roundness.card,
    padding: Spacing.three,
  },
  unread: { backgroundColor: Colors.backgroundSelected },
  icon: { fontSize: 20 },
  body: { flex: 1, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4 },
});
