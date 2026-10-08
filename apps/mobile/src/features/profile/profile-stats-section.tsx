import { getLevelProgress, type MyProfileStats } from '@vybe/shared';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface ProfileStatsSectionProps {
  totalXp: number;
  streakCurrentCount: number;
  stats: MyProfileStats | undefined;
}

export function ProfileStatsSection({ totalXp, streakCurrentCount, stats }: ProfileStatsSectionProps) {
  const progress = getLevelProgress(totalXp);
  const percent = Math.round(progress.progressRatio * 100);

  return (
    <View style={styles.card}>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <ThemedText type="subtitle" themeColor="secondary">
            🔥 {streakCurrentCount}d
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>
            OUTSIDE STREAK
          </ThemedText>
        </View>
        <View style={styles.metric}>
          <ThemedText type="subtitle" themeColor="primary">
            Lvl {progress.level}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>
            EXPLORER RANK
          </ThemedText>
        </View>
        <View style={styles.metric}>
          <ThemedText type="subtitle" themeColor="tertiary">
            {totalXp}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>
            TOTAL XP
          </ThemedText>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <ThemedText type="small" themeColor="textSecondary">
            ROAD TO LEVEL {progress.level + 1}
          </ThemedText>
          <ThemedText type="small" themeColor="primary">
            {progress.xpToNextLevel > 0 ? `${progress.xpToNextLevel} XP to go` : 'Max level'}
          </ThemedText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      </View>

      <View style={styles.quickStatsRow}>
        <QuickStat value={stats?.distinct_events ?? 0} label="Events" />
        <QuickStat value={stats?.distinct_places ?? 0} label="Places" />
        <QuickStat value={stats?.longest_outside_streak ?? 0} label="Longest Streak" />
        <QuickStat value={stats?.crew_count ?? 0} label="Crews" />
      </View>
    </View>
  );
}

function QuickStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.quickStat}>
      <ThemedText type="smallBold">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.backgroundElement, borderRadius: Roundness.card, padding: Spacing.three, gap: Spacing.three },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center', gap: 2, flex: 1 },
  metricLabel: { fontSize: 10, letterSpacing: 0.5 },
  progressSection: { gap: 4 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 8, borderRadius: Roundness.pill, backgroundColor: Colors.background, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Roundness.pill, backgroundColor: Colors.primary },
  quickStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.one, borderTopWidth: 1, borderTopColor: Colors.hairline },
  quickStat: { alignItems: 'center', gap: 2, flex: 1 },
});
