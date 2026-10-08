import type { BusiestPlace } from '@vybe/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface BusiestPlaceBannerProps {
  place: BusiestPlace;
}

export function BusiestPlaceBanner({ place }: BusiestPlaceBannerProps) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/place/[id]', params: { id: place.place_id } })}
      style={styles.banner}>
      <View style={styles.pill}>
        <ThemedText type="small" themeColor="secondary">
          🔥 BUSIEST RIGHT NOW
        </ThemedText>
      </View>
      <ThemedText type="subtitle">{place.place_name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {place.check_in_count} check-in{place.check_in_count === 1 ? '' : 's'} in the last few hours
        {place.place_address ? ` · ${place.place_address}` : ''}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: Roundness.card,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.secondary}22`,
    borderRadius: Roundness.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    marginBottom: 2,
  },
});
