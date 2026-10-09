import type { EventWithStats, PlaceWithStats } from '@vybe/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { HighlightEventCard } from '@/features/events/event-highlight-card';
import { useEventsWithStats } from '@/features/events/use-events-with-stats';
import { BusiestPlaceBanner } from '@/features/explore/busiest-place-banner';
import { useBusiestPlace } from '@/features/explore/use-busiest-place';
import { ExplorePlaceCard } from '@/features/explore/explore-place-card';
import { useDeviceLocation } from '@/features/places/use-device-location';
import { usePlaces } from '@/features/places/use-places';
import { useRecommendedEvents } from '@/features/discovery/use-recommended-events';
import { useRecommendedPlaces } from '@/features/discovery/use-recommended-places';
import { SearchResults } from '@/features/discovery/search-results';
import { haversineDistanceKm } from '@/lib/geo';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { getErrorMessage } from '@/lib/get-error-message';

const SECTIONS = [
  { key: 'places', label: 'Places', createHref: null },
  { key: 'events', label: 'Events', createHref: '/event/create' },
] as const;
type Section = (typeof SECTIONS)[number]['key'];

const PLACE_SORTS = ['for_you', 'trending', 'nearby', 'rated'] as const;
type PlaceSort = (typeof PLACE_SORTS)[number];
const PLACE_SORT_LABELS: Record<PlaceSort, string> = { for_you: 'For You', trending: 'Trending', nearby: 'Nearby', rated: 'Highest Rated' };

const EVENT_FILTERS = ['for_you', 'all', 'trending', 'tonight', 'weekend'] as const;
type EventFilter = (typeof EVENT_FILTERS)[number];
const EVENT_FILTER_LABELS: Record<EventFilter, string> = {
  for_you: 'For You',
  all: 'Upcoming',
  trending: 'Trending',
  tonight: 'Tonight',
  weekend: 'This Weekend',
};

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

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const isSearching = debouncedSearch.length >= 2;

  const isPlacesForYou = placeSort === 'for_you';
  const isEventsForYou = eventFilter === 'for_you';

  const places = usePlaces();
  const recommendedPlaces = useRecommendedPlaces(isPlacesForYou);
  const events = useEventsWithStats();
  const recommendedEvents = useRecommendedEvents(isEventsForYou);
  const busiestPlace = useBusiestPlace();
  const { data: deviceLocation } = useDeviceLocation();

  const filteredPlaces = useMemo(() => {
    const list = isPlacesForYou ? recommendedPlaces.data ?? [] : places.data ?? [];
    if (placeSort === 'rated') {
      return [...list].sort((a, b) => (b.avg_rating ?? -1) - (a.avg_rating ?? -1));
    }
    if (placeSort === 'trending') {
      return [...list].sort((a, b) => b.recent_check_in_count - a.recent_check_in_count);
    }
    if (placeSort === 'nearby' && deviceLocation) {
      return [...list].sort(
        (a, b) =>
          haversineDistanceKm(deviceLocation.lat, deviceLocation.lng, a.lat, a.lng) -
          haversineDistanceKm(deviceLocation.lat, deviceLocation.lng, b.lat, b.lng),
      );
    }
    return list;
  }, [places.data, recommendedPlaces.data, isPlacesForYou, placeSort, deviceLocation]);

  const filteredEvents = useMemo(() => {
    const list = isEventsForYou ? recommendedEvents.data ?? [] : events.data ?? [];
    if (eventFilter === 'tonight') return list.filter((e) => isTonight(e.start_at));
    if (eventFilter === 'weekend') return list.filter((e) => isThisWeekend(e.start_at));
    if (eventFilter === 'trending') {
      return [...list].sort((a, b) => b.interested_count + b.going_count - (a.interested_count + a.going_count));
    }
    return list;
  }, [events.data, recommendedEvents.data, isEventsForYou, eventFilter]);

  const active = SECTIONS.find((s) => s.key === section)!;
  const activePlacesQuery = isPlacesForYou ? recommendedPlaces : places;
  const activeEventsQuery = isEventsForYou ? recommendedEvents : events;
  const activeQuery = section === 'places' ? activePlacesQuery : activeEventsQuery;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <ThemedTextInput placeholder="Search places, people, events, or crews..." value={search} onChangeText={setSearch} />

          {!isSearching && (
            <>
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <View style={styles.chipRow}>
                    {PLACE_SORTS.map((sort) => (
                      <Pressable key={sort} onPress={() => setPlaceSort(sort)}>
                        <ThemedView type={placeSort === sort ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                          <ThemedText type="small">{PLACE_SORT_LABELS[sort]}</ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}
              {section === 'events' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <View style={styles.chipRow}>
                    {EVENT_FILTERS.map((filter) => (
                      <Pressable key={filter} onPress={() => setEventFilter(filter)}>
                        <ThemedView type={eventFilter === filter ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                          <ThemedText type="small">{EVENT_FILTER_LABELS[filter]}</ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}
            </>
          )}
        </View>

        {isSearching ? (
          <SearchResults query={debouncedSearch} />
        ) : (
          <>
            {section === 'places' && !isPlacesForYou && busiestPlace.data && (
              <View style={styles.bannerWrap}>
                <BusiestPlaceBanner place={busiestPlace.data} />
              </View>
            )}

            {section === 'places' ? (
              <FlatList
                data={filteredPlaces}
                keyExtractor={(item: PlaceWithStats) => item.id}
                renderItem={({ item }) => <ExplorePlaceCard place={item} deviceLocation={deviceLocation} />}
                contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                  <EmptyState
                    query={activeQuery}
                    fallback={isPlacesForYou ? "No recommendations yet — check into a few places first." : 'No places in your city yet.'}
                  />
                }
              />
            ) : (
              <FlatList
                data={filteredEvents}
                keyExtractor={(item: EventWithStats) => item.id}
                renderItem={({ item }) => <HighlightEventCard event={item} />}
                contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                  <EmptyState
                    query={activeQuery}
                    fallback={isEventsForYou ? 'No recommendations yet — follow some friends first.' : 'No upcoming events yet — create one.'}
                  />
                }
              />
            )}
          </>
        )}
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
  chipScroll: { marginHorizontal: -Spacing.three },
  chipRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three },
  chip: { borderRadius: Spacing.four, paddingHorizontal: Spacing.two, paddingVertical: 6 },
  bannerWrap: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  listContent: { paddingHorizontal: Spacing.three },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
});
