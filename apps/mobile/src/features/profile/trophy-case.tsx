import { BADGE_ICONS, type EarnedBadge } from '@vybe/shared';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface TrophyCaseProps {
  badges: EarnedBadge[];
}

export function TrophyCase({ badges }: TrophyCaseProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle">🏆 Trophy Case</ThemedText>
        <View style={styles.countPill}>
          <ThemedText type="small" themeColor="primary">
            {badges.length} Unlocked
          </ThemedText>
        </View>
      </View>

      {badges.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No badges yet — check in, post, or join a crew to start unlocking them.
        </ThemedText>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {badges.map((badge) => (
            <View key={badge.id} style={styles.badgeCard}>
              <ThemedText style={styles.icon}>{BADGE_ICONS[badge.slug]}</ThemedText>
              <ThemedText type="smallBold" style={styles.badgeName} numberOfLines={2}>
                {badge.name}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  countPill: { backgroundColor: `${Colors.primary}1A`, borderRadius: Roundness.pill, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  row: { gap: Spacing.two },
  badgeCard: {
    width: 100,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Roundness.card,
    padding: Spacing.two,
    alignItems: 'center',
    gap: Spacing.one,
  },
  icon: { fontSize: 28 },
  badgeName: { textAlign: 'center' },
});
