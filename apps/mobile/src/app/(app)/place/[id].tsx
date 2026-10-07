import { VIBE_TYPES, type VibeType } from '@vybe/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { EventCard } from '@/components/event-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCreateCheckIn } from '@/features/checkins/use-create-check-in';
import { usePlace } from '@/features/places/use-place';
import { usePlaceCheckIns } from '@/features/places/use-place-check-ins';
import { usePlaceEvents } from '@/features/places/use-place-events';
import { usePlaceVibes } from '@/features/places/use-place-vibes';
import { useCreateVibe } from '@/features/vibes/use-create-vibe';
import { formatLabel } from '@/lib/format-label';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getErrorMessage } from '@/lib/get-error-message';
import { useTheme } from '@/hooks/use-theme';

const paramsSchema = z.object({ id: z.uuid() });

export default function PlaceDetailScreen() {
  const parsedParams = paramsSchema.safeParse(useLocalSearchParams());
  const placeId = parsedParams.success ? parsedParams.data.id : undefined;
  const theme = useTheme();

  const place = usePlace(placeId);
  const vibes = usePlaceVibes(placeId);
  const checkIns = usePlaceCheckIns(placeId);
  const placeEvents = usePlaceEvents(placeId);
  const createCheckIn = useCreateCheckIn();
  const createVibe = useCreateVibe();

  const [vibeType, setVibeType] = useState<VibeType>('chill');
  const [vibeText, setVibeText] = useState('');

  if (!parsedParams.success) {
    router.replace('/home');
    return null;
  }

  const handleCheckIn = () => {
    createCheckIn.mutate(
      { place_id: placeId, visibility: 'followers' },
      { onError: (error) => Alert.alert('Could not check in', getErrorMessage(error)) },
    );
  };

  const handleShareVibe = () => {
    createVibe.mutate(
      { vibe_type: vibeType, text: vibeText.trim() || undefined, place_id: placeId, visibility: 'followers' },
      {
        onSuccess: () => setVibeText(''),
        onError: (error) => Alert.alert('Could not share vibe', getErrorMessage(error)),
      },
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {place.data && (
            <View style={styles.header}>
              <ThemedText type="title">{place.data.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatLabel(place.data.category)}
                {place.data.address ? ` · ${place.data.address}` : ''}
              </ThemedText>
              {place.data.description && <ThemedText>{place.data.description}</ThemedText>}
              <ThemedButton
                title={`Check in${checkIns.data ? ` (${checkIns.data.length})` : ''}`}
                onPress={handleCheckIn}
                loading={createCheckIn.isPending}
              />
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="smallBold">Share a vibe here</ThemedText>
            <View style={styles.chipRow}>
              {VIBE_TYPES.map((type) => {
                const selected = type === vibeType;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setVibeType(type)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}>
                    <ThemedText type="small">{formatLabel(type)}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <ThemedTextInput
              placeholder="Say more (optional)"
              value={vibeText}
              onChangeText={setVibeText}
              autoCapitalize="sentences"
            />
            {createVibe.isError && <ThemedText type="small">{getErrorMessage(createVibe.error)}</ThemedText>}
            <ThemedButton title="Share vibe" onPress={handleShareVibe} loading={createVibe.isPending} />
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">Who&apos;s here</ThemedText>
            {vibes.data?.length ? (
              vibes.data.map((vibe) => (
                <ThemedView key={vibe.id} type="backgroundElement" style={styles.vibeRow}>
                  <ThemedText type="smallBold">{vibe.author_display_name ?? vibe.author_username}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatLabel(vibe.vibe_type)} · {formatRelativeTime(vibe.created_at)}
                  </ThemedText>
                  {vibe.text && <ThemedText type="small">{vibe.text}</ThemedText>}
                </ThemedView>
              ))
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No one&apos;s shared a vibe here yet.
              </ThemedText>
            )}
          </View>

          {!!placeEvents.data?.length && (
            <View style={styles.section}>
              <ThemedText type="smallBold">Upcoming events here</ThemedText>
              <FlatList
                data={placeEvents.data}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <EventCard event={{ ...item, place_name: place.data?.name ?? null }} onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })} />
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.three, gap: Spacing.five },
  header: { gap: Spacing.two },
  section: { gap: Spacing.two },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: Spacing.four, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  vibeRow: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half },
  separator: { height: Spacing.two },
});
