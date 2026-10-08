import type { HomeHighlightEvent } from '@vybe/shared';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { useRsvp } from '@/features/events/use-rsvp';

interface HighlightEventCardProps {
  event: HomeHighlightEvent;
}

function formatStartTime(startAt: Date): string {
  const now = new Date();
  const isToday = startAt.toDateString() === now.toDateString();
  const time = startAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return isToday ? `Tonight, ${time}` : time;
}

export function HighlightEventCard({ event }: HighlightEventCardProps) {
  const rsvp = useRsvp();
  const isGoing = event.viewer_status === 'going' || event.viewer_status === 'checked_in';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/event/[id]', params: { id: event.id } })}
      style={styles.card}>
      {event.cover_image_url && (
        <Image source={{ uri: event.cover_image_url }} style={styles.cover} contentFit="cover" />
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.title}>
            {event.title}
          </ThemedText>
          {event.price_label && (
            <ThemedText type="small" themeColor="secondary">
              {event.price_label}
            </ThemedText>
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {event.place_name ?? 'Location TBA'} • {formatStartTime(event.start_at)}
        </ThemedText>

        <View style={styles.statsRow}>
          <ThemedText type="small" themeColor="secondary">
            🔥 {event.interested_count} interested
          </ThemedText>
          <ThemedText type="small" themeColor="tertiary">
            👥 {event.going_count} going
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => rsvp.mutate({ event_id: event.id, status: isGoing ? 'interested' : 'going' })}
            style={({ pressed }) => [styles.joinButton, isGoing && styles.joinButtonActive, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={styles.joinLabel}>
              {isGoing ? "You're In! 🎉" : 'Join Vibe'}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => Share.share({ message: `${event.title} — ${formatStartTime(event.start_at)} at ${event.place_name ?? 'VYBE'}` })}
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold">Share</ThemedText>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.backgroundElement, borderRadius: Roundness.card, overflow: 'hidden' },
  cover: { width: '100%', height: 160 },
  body: { padding: Spacing.three, gap: Spacing.one },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.one },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  joinButton: { flex: 1, height: 44, borderRadius: Roundness.pill, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  joinButtonActive: { backgroundColor: Colors.tertiary },
  joinLabel: { color: Colors.onPrimary },
  shareButton: { height: 44, paddingHorizontal: Spacing.three, borderRadius: Roundness.pill, backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85 },
});
