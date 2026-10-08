import type { MyCheckIn } from '@vybe/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { useToggleCheckInReaction } from '@/features/profile/use-toggle-check-in-reaction';

interface CheckInTimelineItemProps {
  checkIn: MyCheckIn;
}

export function CheckInTimelineItem({ checkIn }: CheckInTimelineItemProps) {
  const toggleReaction = useToggleCheckInReaction();
  const place = checkIn.place_name ?? checkIn.event_title ?? 'Somewhere';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">{place}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeTime(checkIn.created_at)}
        </ThemedText>
      </View>
      {checkIn.note && <ThemedText type="small">{checkIn.note}</ThemedText>}
      <Pressable
        onPress={() => toggleReaction.mutate({ checkInId: checkIn.id, isReacted: checkIn.viewer_has_reacted })}
        hitSlop={8}
        style={styles.reactionButton}
        accessibilityRole="button"
        accessibilityLabel={checkIn.viewer_has_reacted ? 'Remove like' : 'Like check-in'}>
        <ThemedText type="small" themeColor={checkIn.viewer_has_reacted ? 'text' : 'textSecondary'}>
          {checkIn.viewer_has_reacted ? '♥' : '♡'} {checkIn.reaction_count}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.backgroundElement, borderRadius: Roundness.card, padding: Spacing.three, gap: Spacing.one },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reactionButton: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.one },
});
