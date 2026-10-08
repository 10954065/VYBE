import type { ChallengeWithParticipation } from '@vybe/shared';
import { StyleSheet, View } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { useJoinChallenge } from '@/features/crews/use-join-challenge';

interface ChallengeBannerProps {
  challenge: ChallengeWithParticipation;
}

// requirements/progress key convention, set by the engine in
// 20261008000500_home_and_crews_hub.sql: visit_places -> distinct_places,
// everything else -> count.
function progressKey(type: string): string {
  return type === 'visit_places' ? 'distinct_places' : 'count';
}

function numberAt(record: Record<string, unknown> | null, key: string): number {
  const value = record?.[key];
  return typeof value === 'number' ? value : 0;
}

function formatTimeRemaining(endAt: Date): string {
  const ms = endAt.getTime() - Date.now();
  if (ms <= 0) return 'Ending soon';
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h remaining`;
  return `${Math.ceil(hours / 24)}d remaining`;
}

export function ChallengeBanner({ challenge }: ChallengeBannerProps) {
  const joinChallenge = useJoinChallenge();
  const key = progressKey(challenge.type);
  const target = numberAt(challenge.requirements as Record<string, unknown>, key);
  const current = numberAt(challenge.progress as Record<string, unknown> | null, key);
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const hasJoined = !!challenge.joined_at;
  const isComplete = !!challenge.completed_at;

  return (
    <View style={styles.banner}>
      <View style={styles.headerRow}>
        <View style={styles.questPill}>
          <ThemedText type="small" themeColor="secondary">
            WEEKLY QUEST
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="tertiary">
          {formatTimeRemaining(challenge.end_at)}
        </ThemedText>
      </View>

      <ThemedText type="subtitle">{challenge.title}</ThemedText>
      {challenge.description && (
        <ThemedText type="small" themeColor="textSecondary">
          {challenge.description}
        </ThemedText>
      )}

      {hasJoined && (
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <ThemedText type="small">Your progress</ThemedText>
            <ThemedText type="small" themeColor="secondary">
              {current} / {target} ({percent}%)
            </ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.footerRow}>
        <ThemedText type="small" themeColor="tertiary">
          Reward: +{challenge.xp_reward} XP
        </ThemedText>
        {!hasJoined && (
          <ThemedButton title="Join Quest" variant="ghost" onPress={() => joinChallenge.mutate(challenge.id)} />
        )}
        {isComplete && (
          <ThemedText type="smallBold" themeColor="tertiary">
            Completed! 🎉
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: Roundness.card,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questPill: { backgroundColor: `${Colors.secondary}22`, borderRadius: Roundness.pill, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  progressSection: { gap: 4, marginTop: Spacing.one },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 8, borderRadius: Roundness.pill, backgroundColor: Colors.background, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Roundness.pill, backgroundColor: Colors.secondary },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.one },
});
