import type { EventListItem } from '@vybe/shared';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatEventTime } from '@/lib/format-event-time';

interface EventCardProps {
  event: EventListItem;
  onPress: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${event.title}`}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{event.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatEventTime(event.start_at)}
          {event.place_name ? ` · ${event.place_name}` : ''}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
