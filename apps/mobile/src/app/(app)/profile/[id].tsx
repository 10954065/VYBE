import type { ProfileRow } from '@vybe/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { ShareButton } from '@/components/share-button';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { useIsFollowing } from '@/features/discovery/use-is-following';
import { useProfileById } from '@/features/discovery/use-profile-by-id';
import { useProfileFollowCounts } from '@/features/discovery/use-profile-follow-counts';
import { useSocialProof } from '@/features/discovery/use-social-proof';
import { useToggleFollow } from '@/features/feed/use-toggle-follow';
import { useRedirectIfInvalid } from '@/lib/use-redirect-if-invalid';

const paramsSchema = z.object({ id: z.uuid() });

export default function PublicProfileScreen() {
  const parsedParams = paramsSchema.safeParse(useLocalSearchParams());
  const profileId = parsedParams.success ? parsedParams.data.id : undefined;
  const profile = useProfileById(profileId);
  useRedirectIfInvalid(parsedParams.success, '/home');

  if (!parsedParams.success) {
    return null;
  }

  if (!profile.data) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator style={styles.loading} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return <PublicProfileBody profileId={profileId!} profile={profile.data} />;
}

function PublicProfileBody({ profileId, profile }: { profileId: string; profile: ProfileRow }) {
  const followCounts = useProfileFollowCounts(profileId);
  const socialProof = useSocialProof(profileId);
  const isFollowing = useIsFollowing(profileId);
  const toggleFollow = useToggleFollow();

  const handleToggleFollow = () => {
    toggleFollow.mutate({ target_user_id: profileId, is_following: !!isFollowing.data });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <ThemedText type="title">{(profile.display_name ?? profile.username)[0]?.toUpperCase()}</ThemedText>
            </View>
          )}
          <ThemedText type="title">{profile.display_name ?? profile.username}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            @{profile.username}
          </ThemedText>
          {!!profile.bio && (
            <ThemedText type="small" style={styles.bio}>
              {profile.bio}
            </ThemedText>
          )}

          <View style={styles.countsRow}>
            <View style={styles.countItem}>
              <ThemedText type="smallBold">{followCounts.data?.follower_count ?? 0}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Followers
              </ThemedText>
            </View>
            <View style={styles.countItem}>
              <ThemedText type="smallBold">{followCounts.data?.following_count ?? 0}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Following
              </ThemedText>
            </View>
          </View>

          {!!socialProof.data?.mutual_friend_count && (
            <ThemedText type="small" themeColor="tertiary">
              🙋 {socialProof.data.mutual_friend_count} mutual friend{socialProof.data.mutual_friend_count === 1 ? '' : 's'}
            </ThemedText>
          )}

          <View style={styles.actionsRow}>
            <ThemedButton
              title={isFollowing.data ? 'Following' : 'Follow'}
              variant={isFollowing.data ? 'ghost' : 'primary'}
              loading={toggleFollow.isPending}
              onPress={handleToggleFollow}
            />
            <ShareButton entity="profile" id={profileId} title={profile.display_name ?? profile.username} />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loading: { marginTop: Spacing.six },
  header: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  avatar: { width: 96, height: 96, borderRadius: Roundness.pill },
  avatarFallback: { backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  bio: { textAlign: 'center' },
  countsRow: { flexDirection: 'row', gap: Spacing.five, marginTop: Spacing.two },
  countItem: { alignItems: 'center' },
  actionsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
});
