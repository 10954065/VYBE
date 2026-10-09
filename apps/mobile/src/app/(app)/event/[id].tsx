import { useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { ShareButton } from '@/components/share-button';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAttendeeSummary } from '@/features/events/use-attendee-summary';
import { useEvent } from '@/features/events/use-event';
import { useRsvp } from '@/features/events/use-rsvp';
import { useCreateCheckIn } from '@/features/checkins/use-create-check-in';
import { formatEventTime } from '@/lib/format-event-time';
import { formatLabel } from '@/lib/format-label';
import { getErrorMessage } from '@/lib/get-error-message';
import { useRedirectIfInvalid } from '@/lib/use-redirect-if-invalid';

const paramsSchema = z.object({ id: z.uuid() });

export default function EventDetailScreen() {
  const parsedParams = paramsSchema.safeParse(useLocalSearchParams());
  const eventId = parsedParams.success ? parsedParams.data.id : undefined;

  const event = useEvent(eventId);
  const summary = useAttendeeSummary(eventId);
  const rsvp = useRsvp();
  const checkIn = useCreateCheckIn();
  useRedirectIfInvalid(parsedParams.success, '/home');

  if (!parsedParams.success) {
    return null;
  }

  const viewerStatus = summary.data?.viewer_status ?? null;

  const handleRsvp = (status: 'interested' | 'going' | 'cancelled') => {
    rsvp.mutate(
      { event_id: eventId!, status },
      { onError: (error) => Alert.alert('Could not update RSVP', getErrorMessage(error)) },
    );
  };

  const handleCheckIn = () => {
    checkIn.mutate(
      { event_id: eventId, visibility: 'followers' },
      { onError: (error) => Alert.alert('Could not check in', getErrorMessage(error)) },
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {event.data && (
            <View style={styles.header}>
              <ThemedText type="title">{event.data.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatEventTime(event.data.start_at)}
                {event.data.place_name ? ` · ${event.data.place_name}` : ''}
              </ThemedText>
              {event.data.category && <ThemedText type="small">{formatLabel(event.data.category)}</ThemedText>}
              {event.data.description && <ThemedText>{event.data.description}</ThemedText>}
              <ShareButton entity="event" id={eventId!} title={event.data.title} />
            </View>
          )}

          {summary.data && (
            <ThemedView type="backgroundElement" style={styles.summary}>
              <ThemedText type="small">
                {summary.data.going_count} going · {summary.data.interested_count} interested ·{' '}
                {summary.data.checked_in_count} checked in
              </ThemedText>
            </ThemedView>
          )}

          <View style={styles.actions}>
            <ThemedButton
              title={viewerStatus === 'interested' ? 'Interested ✓' : 'Interested'}
              variant={viewerStatus === 'interested' ? 'primary' : 'ghost'}
              onPress={() => handleRsvp('interested')}
              loading={rsvp.isPending && rsvp.variables?.status === 'interested'}
            />
            <ThemedButton
              title={viewerStatus === 'going' ? 'Going ✓' : 'Going'}
              variant={viewerStatus === 'going' ? 'primary' : 'ghost'}
              onPress={() => handleRsvp('going')}
              loading={rsvp.isPending && rsvp.variables?.status === 'going'}
            />
            {viewerStatus && viewerStatus !== 'cancelled' && (
              <ThemedButton
                title="Cancel RSVP"
                variant="ghost"
                onPress={() => handleRsvp('cancelled')}
                loading={rsvp.isPending && rsvp.variables?.status === 'cancelled'}
              />
            )}
          </View>

          {(viewerStatus === 'going' || viewerStatus === 'checked_in') && (
            <ThemedButton
              title={viewerStatus === 'checked_in' ? 'Checked in ✓ — check in again' : 'Check in'}
              variant="ghost"
              onPress={handleCheckIn}
              loading={checkIn.isPending}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.three, gap: Spacing.four },
  header: { gap: Spacing.two },
  summary: { borderRadius: Spacing.three, padding: Spacing.three },
  actions: { gap: Spacing.two },
});
