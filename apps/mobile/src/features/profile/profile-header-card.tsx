import type { ProfileRow } from '@vybe/shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface ProfileHeaderCardProps {
  profile: ProfileRow;
  cityName: string | undefined;
  isOutsideNow: boolean;
}

export function ProfileHeaderCard({ profile, cityName, isOutsideNow }: ProfileHeaderCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {isOutsideNow ? (
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <ThemedText type="small" themeColor="tertiary" style={styles.statusLabel}>
              OUTSIDE NOW
            </ThemedText>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.actionRow}>
          <Pressable onPress={() => router.push('/(app)/profile/edit')} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold">Edit</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/profile/settings')}
            accessibilityLabel="Settings"
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold">⚙</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.identityRow}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText type="title">{(profile.display_name ?? profile.username)[0]?.toUpperCase()}</ThemedText>
          </View>
        )}
        <View style={styles.identityInfo}>
          <View style={styles.nameRow}>
            <ThemedText type="subtitle">{profile.display_name ?? profile.username}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              @{profile.username}
            </ThemedText>
          </View>
          {cityName && (
            <ThemedText type="small" themeColor="tertiary">
              📍 {cityName}, Ghana
            </ThemedText>
          )}
          {profile.bio && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.bio}>
              {profile.bio}
            </ThemedText>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.backgroundElement, borderRadius: Roundness.card, padding: Spacing.three, gap: Spacing.three },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundSelected,
    borderRadius: Roundness.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.tertiary },
  statusLabel: { fontWeight: '700', letterSpacing: 0.5 },
  actionRow: { flexDirection: 'row', gap: Spacing.two },
  actionButton: { height: 36, paddingHorizontal: Spacing.three, borderRadius: Roundness.pill, backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 36, height: 36, borderRadius: Roundness.pill, backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85 },
  identityRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  avatar: { width: 72, height: 72, borderRadius: Roundness.pill },
  avatarFallback: { backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  identityInfo: { flex: 1, gap: 4, paddingTop: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  bio: { marginTop: 2 },
});
