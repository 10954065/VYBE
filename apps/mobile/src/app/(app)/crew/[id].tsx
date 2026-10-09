import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { ReportButton } from '@/components/report-button';
import { ShareButton } from '@/components/share-button';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useApproveMember } from '@/features/crews/use-approve-member';
import { useCrew } from '@/features/crews/use-crew';
import { useCrewMembers } from '@/features/crews/use-crew-members';
import { useCrewPendingMembers } from '@/features/crews/use-crew-pending-members';
import { useCrewPosts } from '@/features/crews/use-crew-posts';
import { useJoinCrew } from '@/features/crews/use-join-crew';
import { useLeaveCrew } from '@/features/crews/use-leave-crew';
import { useMyMembership } from '@/features/crews/use-my-membership';
import { useRemoveMember } from '@/features/crews/use-remove-member';
import { useCreatePost } from '@/features/feed/use-create-post';
import { formatLabel } from '@/lib/format-label';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getErrorMessage } from '@/lib/get-error-message';
import { useRedirectIfInvalid } from '@/lib/use-redirect-if-invalid';

const paramsSchema = z.object({ id: z.uuid() });

export default function CrewDetailScreen() {
  const parsedParams = paramsSchema.safeParse(useLocalSearchParams());
  const crewId = parsedParams.success ? parsedParams.data.id : undefined;

  const crew = useCrew(crewId);
  const membership = useMyMembership(crewId);
  const members = useCrewMembers(crewId);
  const isAdmin = membership.data?.status === 'approved' && membership.data.role !== 'member';
  const pending = useCrewPendingMembers(crewId, isAdmin);
  const posts = useCrewPosts(crewId);

  const joinCrew = useJoinCrew();
  const leaveCrew = useLeaveCrew();
  const approveMember = useApproveMember();
  const removeMember = useRemoveMember();
  const createPost = useCreatePost();
  useRedirectIfInvalid(parsedParams.success, '/explore');

  const [draft, setDraft] = useState('');

  if (!parsedParams.success) {
    return null;
  }

  const handleJoin = () => {
    joinCrew.mutate(crewId!, { onError: (error) => Alert.alert('Could not join', getErrorMessage(error)) });
  };

  const handleLeave = () => {
    leaveCrew.mutate(crewId!, { onError: (error) => Alert.alert('Could not leave', getErrorMessage(error)) });
  };

  const handlePost = () => {
    const body = draft.trim();
    if (!body) return;
    createPost.mutate(
      { body, visibility: 'crew', crew_id: crewId },
      { onSuccess: () => setDraft('') },
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {crew.data && (
            <View style={styles.header}>
              <ThemedText type="title">{crew.data.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {crew.data.privacy === 'private' ? 'Private' : 'Public'} · {crew.data.member_count}{' '}
                {crew.data.member_count === 1 ? 'member' : 'members'}
                {crew.data.category ? ` · ${formatLabel(crew.data.category)}` : ''}
              </ThemedText>
              {crew.data.description && <ThemedText>{crew.data.description}</ThemedText>}

              <ShareButton entity="crew" id={crewId!} title={crew.data.name} />
              <ReportButton targetType="crew" targetId={crewId!} />

              {!membership.data && (
                <ThemedButton
                  title={crew.data.privacy === 'private' ? 'Request to join' : 'Join crew'}
                  onPress={handleJoin}
                  loading={joinCrew.isPending}
                />
              )}
              {membership.data?.status === 'pending' && (
                <ThemedText type="small">Request pending approval.</ThemedText>
              )}
              {membership.data?.status === 'approved' && (
                <ThemedButton title="Leave crew" variant="ghost" onPress={handleLeave} loading={leaveCrew.isPending} />
              )}
            </View>
          )}

          {isAdmin && !!pending.data?.length && (
            <View style={styles.section}>
              <ThemedText type="smallBold">Pending requests</ThemedText>
              {pending.data.map((request) => (
                <ThemedView key={request.user_id} type="backgroundElement" style={styles.memberRow}>
                  <ThemedText type="small">{request.display_name ?? request.username}</ThemedText>
                  <View style={styles.memberActions}>
                    <ThemedButton
                      title="Approve"
                      onPress={() => approveMember.mutate({ crewId: crewId!, userId: request.user_id })}
                      loading={approveMember.isPending}
                    />
                    <ThemedButton
                      title="Reject"
                      variant="ghost"
                      onPress={() => removeMember.mutate({ crewId: crewId!, userId: request.user_id })}
                      loading={removeMember.isPending}
                    />
                  </View>
                </ThemedView>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="smallBold">Members</ThemedText>
            {members.data?.length ? (
              members.data.map((member) => (
                <ThemedText key={member.user_id} type="small">
                  {member.display_name ?? member.username}
                  {member.role !== 'member' ? ` · ${formatLabel(member.role)}` : ''}
                </ThemedText>
              ))
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No members yet.
              </ThemedText>
            )}
          </View>

          {membership.data?.status === 'approved' && (
            <View style={styles.section}>
              <ThemedText type="smallBold">Crew feed</ThemedText>
              <ThemedView type="backgroundElement" style={styles.composer}>
                <ThemedTextInput
                  placeholder="Share something with the crew"
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  autoCapitalize="sentences"
                />
                {createPost.isError && <ThemedText type="small">{getErrorMessage(createPost.error)}</ThemedText>}
                <ThemedButton title="Post" onPress={handlePost} loading={createPost.isPending} disabled={!draft.trim()} />
              </ThemedView>

              {posts.data?.length ? (
                posts.data.map((post) => (
                  <ThemedView key={post.id} type="backgroundElement" style={styles.postRow}>
                    <ThemedText type="smallBold">{post.author_display_name ?? post.author_username}</ThemedText>
                    {post.body && <ThemedText type="small">{post.body}</ThemedText>}
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatRelativeTime(post.created_at)}
                    </ThemedText>
                  </ThemedView>
                ))
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Nothing posted yet.
                </ThemedText>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.three, gap: Spacing.five },
  header: { gap: Spacing.two },
  section: { gap: Spacing.two },
  memberRow: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  memberActions: { flexDirection: 'row', gap: Spacing.two },
  composer: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  postRow: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half },
});
