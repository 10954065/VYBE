import type { Place } from '@vybe/shared';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatLabel } from '@/lib/format-label';

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
}

export function PlaceCard({ place, onPress }: PlaceCardProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${place.name}`}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{place.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatLabel(place.category)}
          {place.address ? ` · ${place.address}` : ''}
        </ThemedText>
        {place.description && (
          <ThemedText type="small" numberOfLines={2}>
            {place.description}
          </ThemedText>
        )}
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
