import type { Crew, EventListItem, Place } from '@vybe/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CrewCard } from '@/components/crew-card';
import { EventCard } from '@/components/event-card';
import { PlaceCard } from '@/components/place-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCrews } from '@/features/crews/use-crews';
import { useEvents } from '@/features/events/use-events';
import { usePlaces } from '@/features/places/use-places';
import { getErrorMessage } from '@/lib/get-error-message';

const SECTIONS = [
  { key: 'places', label: 'Places', emptyMessage: 'No places in your city yet.', createHref: null },
  { key: 'events', label: 'Events', emptyMessage: 'No upcoming events yet — create one.', createHref: '/event/create' },
  { key: 'crews', label: 'Crews', emptyMessage: 'No crews in your city yet — start one.', createHref: '/crew/create' },
] as const;
type Section = (typeof SECTIONS)[number]['key'];

export default function ExploreScreen() {
  const [section, setSection] = useState<Section>('places');
  const places = usePlaces();
  const events = useEvents();
  const crews = useCrews();

  const active = SECTIONS.find((s) => s.key === section)!;
  const query = section === 'places' ? places : section === 'events' ? events : crews;

  const data: (Place | EventListItem | Crew)[] = places.data && section === 'places'
    ? places.data
    : events.data && section === 'events'
      ? events.data
      : (crews.data ?? []);

  const renderItem = ({ item }: { item: Place | EventListItem | Crew }) => {
    if (section === 'places') {
      return (
        <PlaceCard place={item as Place} onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })} />
      );
    }
    if (section === 'events') {
      return (
        <EventCard
          event={item as EventListItem}
          onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
        />
      );
    }
    return (
      <CrewCard crew={item as Crew} onPress={() => router.push({ pathname: '/crew/[id]', params: { id: item.id } })} />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.segmentRow}>
          {SECTIONS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSection(s.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: section === s.key }}>
              <ThemedView type={section === s.key ? 'backgroundSelected' : 'backgroundElement'} style={styles.segment}>
                <ThemedText type="smallBold">{s.label}</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
          {active.createHref && (
            <ThemedButton title="+ New" variant="ghost" onPress={() => router.push(active.createHref)} />
          )}
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            query.isLoading ? (
              <ActivityIndicator style={styles.emptyState} />
            ) : (
              <ThemedText type="small" style={styles.emptyState}>
                {query.isError ? getErrorMessage(query.error) : active.emptyMessage}
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
