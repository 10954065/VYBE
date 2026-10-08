import type { LeaderboardEntry } from '@vybe/shared';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isViewer: boolean;
}

export function LeaderboardRow({ entry, isViewer }: LeaderboardRowProps) {
  return (
    <View style={[styles.row, isViewer && styles.rowHighlighted]}>
      <ThemedText type="subtitle" themeColor={isViewer ? 'primary' : 'text'} style={styles.rank}>
        {entry.rank}
      </ThemedText>
      {entry.avatar_url ? (
        <Image source={{ uri: entry.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <ThemedText type="smallBold">{(entry.display_name ?? entry.username)[0]?.toUpperCase()}</ThemedText>
        </View>
      )}
      <View style={styles.info}>
        <ThemedText type="smallBold" themeColor={isViewer ? 'primary' : 'text'}>
          {entry.display_name ?? entry.username}
          {isViewer ? ' (You)' : ''}
        </ThemedText>
        {entry.outside_streak_current > 0 && (
          <ThemedText type="small" themeColor="secondary">
            🔥 {entry.outside_streak_current}d streak
          </ThemedText>
        )}
      </View>
      <View style={styles.xpCol}>
        <ThemedText type="smallBold" themeColor={isViewer ? 'primary' : 'text'}>
          {entry.total_xp}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          XP
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Roundness.card,
  },
  rowHighlighted: { backgroundColor: `${Colors.primary}1A` },
  rank: { width: 24, textAlign: 'center' },
  avatar: { width: 36, height: 36, borderRadius: Roundness.pill },
  avatarFallback: { backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  xpCol: { alignItems: 'flex-end' },
});
