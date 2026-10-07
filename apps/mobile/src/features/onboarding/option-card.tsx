import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Glow, Roundness, Spacing } from '@/constants/theme';

interface OptionCardProps {
  emoji: string;
  title: string;
  tag?: string;
  subtitle: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  accent?: 'primary' | 'secondary' | 'tertiary';
}

/** A selectable preference row — shared by the radius, pace, crew, and privacy groups. */
export function OptionCard({ emoji, title, tag, subtitle, description, selected, onPress, accent = 'primary' }: OptionCardProps) {
  const accentColor = Colors[accent];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.card, selected && { borderColor: accentColor, ...Glow.primary, shadowColor: accentColor }]}>
      <View style={styles.row}>
        <View style={styles.leading}>
          <ThemedText style={styles.emoji}>{emoji}</ThemedText>
          <View style={styles.titleColumn}>
            <View style={styles.titleRow}>
              <ThemedText type="smallBold">{title}</ThemedText>
              {tag && (
                <View style={[styles.tagPill, { backgroundColor: `${accentColor}33` }]}>
                  <ThemedText type="small" style={{ color: accentColor }}>
                    {tag}
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText type="small" style={{ color: accentColor }}>
              {subtitle}
            </ThemedText>
          </View>
        </View>
        <View
          style={[
            styles.indicator,
            selected ? { backgroundColor: accentColor } : { backgroundColor: Colors.backgroundElement },
          ]}>
          {selected && <View style={styles.indicatorDot} />}
        </View>
      </View>
      {description && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
          {description}
        </ThemedText>
      )}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  leading: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, flex: 1 },
  emoji: { fontSize: 22 },
  titleColumn: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexWrap: 'wrap' },
  tagPill: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Roundness.pill },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: Roundness.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDot: { width: 8, height: 8, borderRadius: Roundness.pill, backgroundColor: Colors.onPrimary },
  description: { lineHeight: 18 },
});
