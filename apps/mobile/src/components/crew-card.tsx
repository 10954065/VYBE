import type { Crew } from '@vybe/shared';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { SocialProofLine } from '@/features/discovery/social-proof-line';
import { formatLabel } from '@/lib/format-label';

interface CrewCardProps {
  crew: Crew & { friend_member_count?: number };
  onPress: () => void;
}

export function CrewCard({ crew, onPress }: CrewCardProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${crew.name}`}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{crew.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {crew.privacy === 'private' ? 'Private' : 'Public'} · {crew.member_count}{' '}
          {crew.member_count === 1 ? 'member' : 'members'}
          {crew.category ? ` · ${formatLabel(crew.category)}` : ''}
        </ThemedText>
        {crew.description && (
          <ThemedText type="small" numberOfLines={2}>
            {crew.description}
          </ThemedText>
        )}
        <SocialProofLine friendCount={crew.friend_member_count ?? 0} phrase="already in" />
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
