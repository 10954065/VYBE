import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import type { NEIGHBORHOOD_CATALOG } from './neighborhood-catalog';

interface NeighborhoodCardProps {
  entry: (typeof NEIGHBORHOOD_CATALOG)[number];
  selected: boolean;
  onPress: () => void;
}

export function NeighborhoodCard({ entry, selected, onPress }: NeighborhoodCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: entry.photoUrl }} style={styles.photo} contentFit="cover" />
        <View style={styles.photoOverlay} />
        <View style={[styles.selectionPill, selected && styles.selectionPillSelected]}>
          <ThemedText style={selected ? styles.checkMark : styles.plusMark}>{selected ? '✓' : '+'}</ThemedText>
        </View>
        <View style={styles.photoTitle}>
          <ThemedText type="smallBold">{entry.name}</ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
        {entry.description}
      </ThemedText>
      <View style={styles.tagRow}>
        {entry.tags.map((tag) => (
          <View key={tag} style={styles.tagPill}>
            <ThemedText type="small" themeColor="primary">
              {tag}
            </ThemedText>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Roundness.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.backgroundElement,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardSelected: { borderColor: Colors.primary },
  photoWrap: { height: 140, borderRadius: Roundness.card, overflow: 'hidden', backgroundColor: Colors.background },
  photo: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 10, 15, 0.25)',
  },
  selectionPill: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 28,
    height: 28,
    borderRadius: Roundness.pill,
    backgroundColor: 'rgba(18, 19, 28, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionPillSelected: { backgroundColor: Colors.primary },
  checkMark: { color: Colors.onPrimary, fontWeight: '700' },
  plusMark: { color: Colors.textSecondary, fontWeight: '700' },
  photoTitle: { position: 'absolute', bottom: Spacing.two, left: Spacing.two, right: Spacing.two },
  description: {},
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  tagPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Roundness.pill,
    backgroundColor: `${Colors.primary}22`,
  },
});
