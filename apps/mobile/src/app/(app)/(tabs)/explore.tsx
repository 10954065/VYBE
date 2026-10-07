import type { EventListItem, Place } from '@vybe/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/event-card';
import { PlaceCard } from '@/components/place-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useEvents } from '@/features/events/use-events';
import { usePlaces } from '@/features/places/use-places';
import { getErrorMessage } from '@/lib/get-error-message';

type Section = 'places' | 'events';

export default function ExploreScreen() {
  const [section, setSection] = useState<Section>('places');
  const places = usePlaces();
  const events = useEvents();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.segmentRow}>
          <Pressable
            onPress={() => setSection('places')}
            accessibilityRole="button"
            accessibilityState={{ selected: section === 'places' }}>
            <ThemedView type={section === 'places' ? 'backgroundSelected' : 'backgroundElement'} style={styles.segment}>
              <ThemedText type="smallBold">Places</ThemedText>
            </ThemedView>
          </Pressable>
          <Pressable
            onPress={() => setSection('events')}
            accessibilityRole="button"
            accessibilityState={{ selected: section === 'events' }}>
            <ThemedView type={section === 'events' ? 'backgroundSelected' : 'backgroundElement'} style={styles.segment}>
              <ThemedText type="smallBold">Events</ThemedText>
            </ThemedView>
          </Pressable>
          {section === 'events' && (
            <ThemedButton title="+ New" variant="ghost" onPress={() => router.push('/event/create')} />
          )}
        </View>

        {section === 'places' ? (
          <FlatList
            data={places.data ?? []}
            keyExtractor={(item: Place) => item.id}
            renderItem={({ item }) => <PlaceCard place={item} onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              places.isLoading ? (
                <ActivityIndicator style={styles.emptyState} />
              ) : (
                <ThemedText type="small" style={styles.emptyState}>
                  {places.isError ? getErrorMessage(places.error) : 'No places in your city yet.'}
                </ThemedText>
              )
            }
          />
        ) : (
          <FlatList
            data={events.data ?? []}
            keyExtractor={(item: EventListItem) => item.id}
            renderItem={({ item }) => <EventCard event={item} onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              events.isLoading ? (
                <ActivityIndicator style={styles.emptyState} />
              ) : (
                <ThemedText type="small" style={styles.emptyState}>
                  {events.isError ? getErrorMessage(events.error) : 'No upcoming events yet — create one.'}
                </ThemedText>
              )
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  segment: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  listContent: { paddingHorizontal: Spacing.three },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
});
