import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Glow, Roundness, Spacing } from '@/constants/theme';
import type { GENRE_CATALOG } from './genre-catalog';

interface GenreCardProps {
  entry: (typeof GENRE_CATALOG)[number];
  selected: boolean;
  onPress: () => void;
}

export function GenreCard({ entry, selected, onPress }: GenreCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
          <ThemedText style={styles.emoji}>{entry.emoji}</ThemedText>
        </View>
        <View style={styles.column}>
          <View style={styles.titleRow}>
            <ThemedText type="smallBold">{entry.name}</ThemedText>
            <View style={styles.tagPill}>
              <ThemedText type="small" themeColor="primary">
                {entry.tag}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {entry.artists}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {entry.areaLabel}
          </ThemedText>
        </View>
        <View style={[styles.checkBadge, selected && styles.checkBadgeSelected]}>
          {selected && <ThemedText style={styles.checkMark}>✓</ThemedText>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Roundness.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.background,
    padding: Spacing.three,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundElement,
    ...Glow.primary,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Roundness.pill,
    backgroundColor: Colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: { backgroundColor: `${Colors.primary}33` },
  emoji: { fontSize: 22 },
  column: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexWrap: 'wrap' },
  tagPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Roundness.pill,
    backgroundColor: `${Colors.primary}22`,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: Roundness.pill,
    backgroundColor: Colors.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeSelected: { backgroundColor: Colors.primary },
  checkMark: { color: Colors.onPrimary, fontWeight: '700' },
});
