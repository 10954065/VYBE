import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { formatLabel } from '@/lib/format-label';
import { useSearchCrews } from '@/features/discovery/use-search-crews';
import { useSearchEvents } from '@/features/discovery/use-search-events';
import { useSearchPeople } from '@/features/discovery/use-search-people';
import { useSearchPlaces } from '@/features/discovery/use-search-places';
import { SearchResultRow } from '@/features/discovery/search-result-row';

interface SearchResultsProps {
  query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const people = useSearchPeople(query);
  const places = useSearchPlaces(query);
  const events = useSearchEvents(query);
  const crews = useSearchCrews(query);

  const isLoading = people.isLoading || places.isLoading || events.isLoading || crews.isLoading;
  const totalResults = (people.data?.length ?? 0) + (places.data?.length ?? 0) + (events.data?.length ?? 0) + (crews.data?.length ?? 0);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.three }]}>
      {!!people.data?.length && (
        <View style={styles.section}>
          <ThemedText type="subtitle">People</ThemedText>
          {people.data.map((person) => (
            <SearchResultRow
              key={person.id}
              imageUrl={person.avatar_url}
              fallbackLabel={person.display_name ?? person.username}
              title={person.display_name ?? person.username}
              subtitle={`@${person.username}`}
              onPress={() => router.push({ pathname: '/(app)/profile/[id]', params: { id: person.id } })}
            />
          ))}
        </View>
      )}

      {!!places.data?.length && (
        <View style={styles.section}>
          <ThemedText type="subtitle">Places</ThemedText>
          {places.data.map((place) => (
            <SearchResultRow
              key={place.id}
              imageUrl={place.cover_image_url}
              fallbackLabel={place.name}
              title={place.name}
              subtitle={`${formatLabel(place.category)}${place.address ? ` · ${place.address}` : ''}`}
              onPress={() => router.push({ pathname: '/(app)/place/[id]', params: { id: place.id } })}
            />
          ))}
        </View>
      )}

      {!!events.data?.length && (
        <View style={styles.section}>
          <ThemedText type="subtitle">Events</ThemedText>
          {events.data.map((event) => (
            <SearchResultRow
              key={event.id}
              imageUrl={event.cover_image_url}
              fallbackLabel={event.title}
              title={event.title}
              subtitle={event.place_name ?? undefined}
              onPress={() => router.push({ pathname: '/(app)/event/[id]', params: { id: event.id } })}
            />
          ))}
        </View>
      )}

      {!!crews.data?.length && (
        <View style={styles.section}>
          <ThemedText type="subtitle">Crews</ThemedText>
          {crews.data.map((crew) => (
            <SearchResultRow
              key={crew.id}
              imageUrl={crew.avatar_url}
              fallbackLabel={crew.name}
              title={crew.name}
              subtitle={`${crew.member_count} ${crew.member_count === 1 ? 'member' : 'members'}`}
              onPress={() => router.push({ pathname: '/(app)/crew/[id]', params: { id: crew.id } })}
            />
          ))}
        </View>
      )}

      {isLoading && <ActivityIndicator style={styles.emptyState} />}
      {!isLoading && totalResults === 0 && (
        <ThemedText type="small" style={styles.emptyState}>
          {`No matches for "${query}".`}
        </ThemedText>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.three, gap: Spacing.four },
  section: { gap: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
});
