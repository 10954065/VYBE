import { getLevelProgress } from '@vybe/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface GamificationCardProps {
  totalXp: number;
  streakCurrentCount: number;
}

export function GamificationCard({ totalXp, streakCurrentCount }: GamificationCardProps) {
  const progress = getLevelProgress(totalXp);
  const percent = Math.round(progress.progressRatio * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <ThemedText style={styles.fire}>🔥</ThemedText>
        </View>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle">
              {streakCurrentCount} Day{streakCurrentCount === 1 ? '' : 's'} Streak
            </ThemedText>
            <View style={styles.xpPill}>
              <ThemedText type="small" themeColor="tertiary" style={styles.xpPillText}>
                Lvl {progress.level}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {progress.xpToNextLevel > 0 ? `${progress.xpToNextLevel} XP to Level ${progress.level + 1}` : 'Max level'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <Pressable
        onPress={() => router.push('/(app)/(tabs)/explore')}
        style={({ pressed }) => [styles.checkInButton, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.checkInLabel}>
          Check In (+10 XP)
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: Roundness.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: {
    width: 48,
    height: 48,
    borderRadius: Roundness.card,
    backgroundColor: `${Colors.secondary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fire: { fontSize: 24 },
  headerText: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  xpPill: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Roundness.pill, backgroundColor: `${Colors.tertiary}22` },
  xpPillText: { fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: Roundness.pill, backgroundColor: Colors.background, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Roundness.pill, backgroundColor: Colors.primary },
  checkInButton: {
    height: 44,
    borderRadius: Roundness.pill,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  checkInLabel: { color: Colors.onPrimary },
});
