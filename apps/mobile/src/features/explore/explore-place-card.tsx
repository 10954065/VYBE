import type { PlaceWithStats } from '@vybe/shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { SocialProofLine } from '@/features/discovery/social-proof-line';
import { formatDistanceKm, haversineDistanceKm } from '@/lib/geo';
import { formatLabel } from '@/lib/format-label';
import type { DeviceLocation } from '@/features/places/use-device-location';

interface ExplorePlaceCardProps {
  place: PlaceWithStats & { friend_check_in_count?: number };
  deviceLocation: DeviceLocation | null | undefined;
}

export function ExplorePlaceCard({ place, deviceLocation }: ExplorePlaceCardProps) {
  const distanceKm = deviceLocation ? haversineDistanceKm(deviceLocation.lat, deviceLocation.lng, place.lat, place.lng) : null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/place/[id]', params: { id: place.id } })}
      style={styles.card}>
      {place.cover_image_url && (
        <View style={styles.coverWrap}>
          <Image source={{ uri: place.cover_image_url }} style={styles.cover} contentFit="cover" />
          {place.recent_check_in_count > 0 && (
            <View style={styles.checkedInBadge}>
              <ThemedText type="small" themeColor="secondary">
                🔥 {place.recent_check_in_count} checked in tonight
              </ThemedText>
            </View>
          )}
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <ThemedText type="subtitle">{place.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatLabel(place.category)}
              {place.address ? ` · ${place.address}` : ''}
            </ThemedText>
          </View>
          {place.avg_rating != null && (
            <View style={styles.ratingPill}>
              <ThemedText type="smallBold">★ {place.avg_rating.toFixed(1)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                ({place.rating_count})
              </ThemedText>
            </View>
          )}
        </View>

        <SocialProofLine friendCount={place.friend_check_in_count ?? 0} phrase="been here" />

        <View style={styles.footerRow}>
          {distanceKm != null ? (
            <ThemedText type="small" themeColor="primary">
              {formatDistanceKm(distanceKm)}
            </ThemedText>
          ) : (
            <View />
          )}
          <Pressable
            onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`)}
            style={({ pressed }) => [styles.directionsButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold">Directions</ThemedText>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.backgroundElement, borderRadius: Roundness.card, overflow: 'hidden' },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 160 },
  checkedInBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: 'rgba(9, 10, 15, 0.85)',
    borderRadius: Roundness.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  body: { padding: Spacing.three, gap: Spacing.two },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  titleCol: { flex: 1, gap: 2 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  directionsButton: {
    height: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Roundness.pill,
    backgroundColor: Colors.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
