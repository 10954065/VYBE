import type { Crew, EventWithStats, PlaceWithStats } from '@vybe/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CrewCard } from '@/components/crew-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCrews } from '@/features/crews/use-crews';
import { HighlightEventCard } from '@/features/events/event-highlight-card';
import { useEventsWithStats } from '@/features/events/use-events-with-stats';
import { BusiestPlaceBanner } from '@/features/explore/busiest-place-banner';
import { useBusiestPlace } from '@/features/explore/use-busiest-place';
import { ExplorePlaceCard } from '@/features/explore/explore-place-card';
import { useDeviceLocation } from '@/features/places/use-device-location';
import { usePlaces } from '@/features/places/use-places';
import { haversineDistanceKm } from '@/lib/geo';
import { getErrorMessage } from '@/lib/get-error-message';

const SECTIONS = [
  { key: 'places', label: 'Places', createHref: null },
  { key: 'events', label: 'Events', createHref: '/event/create' },
  { key: 'crews', label: 'Crews', createHref: '/crew/create' },
] as const;
type Section = (typeof SECTIONS)[number]['key'];

const PLACE_SORTS = ['trending', 'nearby', 'rated'] as const;
type PlaceSort = (typeof PLACE_SORTS)[number];
const PLACE_SORT_LABELS: Record<PlaceSort, string> = { trending: 'Trending', nearby: 'Nearby', rated: 'Highest Rated' };

const EVENT_FILTERS = ['all', 'tonight', 'weekend'] as const;
type EventFilter = (typeof EVENT_FILTERS)[number];
const EVENT_FILTER_LABELS: Record<EventFilter, string> = { all: 'Upcoming', tonight: 'Tonight', weekend: 'This Weekend' };

function isTonight(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

function isThisWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 5 || day === 6;
}

export default function ExploreScreen() {
  const [section, setSection] = useState<Section>('places');
  const [search, setSearch] = useState('');
  const [placeSort, setPlaceSort] = useState<PlaceSort>('trending');
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');

  const places = usePlaces();
  const events = useEventsWithStats();
  const crews = useCrews();
  const busiestPlace = useBusiestPlace();
  const { data: deviceLocation } = useDeviceLocation();

  const filteredPlaces = useMemo(() => {
    const list = (places.data ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (placeSort === 'rated') {
      return [...list].sort((a, b) => (b.avg_rating ?? -1) - (a.avg_rating ?? -1));
    }
    if (placeSort === 'nearby' && deviceLocation) {
      return [...list].sort(
        (a, b) =>
          haversineDistanceKm(deviceLocation.lat, deviceLocation.lng, a.lat, a.lng) -
          haversineDistanceKm(deviceLocation.lat, deviceLocation.lng, b.lat, b.lng),
      );
    }
    return list;
  }, [places.data, search, placeSort, deviceLocation]);

  const filteredEvents = useMemo(() => {
    const list = (events.data ?? []).filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));
    if (eventFilter === 'tonight') return list.filter((e) => isTonight(e.start_at));
    if (eventFilter === 'weekend') return list.filter((e) => isThisWeekend(e.start_at));
    return list;
  }, [events.data, search, eventFilter]);

  const filteredCrews = useMemo(
    () => (crews.data ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [crews.data, search],
  );

  const active = SECTIONS.find((s) => s.key === section)!;
  const activeQuery = section === 'places' ? places : section === 'events' ? events : crews;
  const isEmpty =
    (section === 'places' && filteredPlaces.length === 0) ||
    (section === 'events' && filteredEvents.length === 0) ||
    (section === 'crews' && filteredCrews.length === 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <ThemedTextInput
            placeholder="Search places, events, or crews..."
            value={search}
            onChangeText={setSearch}
          />
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

          {section === 'places' && (
            <View style={styles.chipRow}>
              {PLACE_SORTS.map((sort) => (
                <Pressable key={sort} onPress={() => setPlaceSort(sort)}>
                  <ThemedView type={placeSort === sort ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                    <ThemedText type="small">{PLACE_SORT_LABELS[sort]}</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>
          )}
          {section === 'events' && (
            <View style={styles.chipRow}>
              {EVENT_FILTERS.map((filter) => (
                <Pressable key={filter} onPress={() => setEventFilter(filter)}>
                  <ThemedView type={eventFilter === filter ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                    <ThemedText type="small">{EVENT_FILTER_LABELS[filter]}</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {section === 'places' && busiestPlace.data && (
          <View style={styles.bannerWrap}>
            <BusiestPlaceBanner place={busiestPlace.data} />
          </View>
        )}

        {section === 'places' && (
          <FlatList
            data={filteredPlaces}
            keyExtractor={(item: PlaceWithStats) => item.id}
            renderItem={({ item }) => <ExplorePlaceCard place={item} deviceLocation={deviceLocation} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={<EmptyState query={activeQuery} fallback="No places in your city yet." />}
          />
        )}
        {section === 'events' && (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item: EventWithStats) => item.id}
            renderItem={({ item }) => <HighlightEventCard event={item} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={<EmptyState query={activeQuery} fallback="No upcoming events yet — create one." />}
          />
        )}
        {section === 'crews' && (
          <FlatList
            data={filteredCrews}
            keyExtractor={(item: Crew) => item.id}
            renderItem={({ item }) => (
              <CrewCard crew={item} onPress={() => router.push({ pathname: '/(app)/crew/[id]', params: { id: item.id } })} />
            )}
            contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={<EmptyState query={activeQuery} fallback="No crews in your city yet — start one." />}
          />
        )}
        {!isEmpty && activeQuery.isLoading && <ActivityIndicator style={styles.emptyState} />}
      </SafeAreaView>
    </ThemedView>
  );
}

function EmptyState({ query, fallback }: { query: { isLoading: boolean; isError: boolean; error: unknown }; fallback: string }) {
  if (query.isLoading) return <ActivityIndicator style={styles.emptyState} />;
  return (
    <ThemedText type="small" style={styles.emptyState}>
      {query.isError ? getErrorMessage(query.error) : fallback}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: { gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  segmentRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  segment: { borderRadius: Spacing.four, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  chipRow: { flexDirection: 'row', gap: Spacing.two },
  chip: { borderRadius: Spacing.four, paddingHorizontal: Spacing.two, paddingVertical: 6 },
  bannerWrap: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  listContent: { paddingHorizontal: Spacing.three },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
});
