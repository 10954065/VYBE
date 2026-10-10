import type { Comment } from '@vybe/shared';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { PostCard } from '@/components/post-card';
import { ReportButton } from '@/components/report-button';
import { ShareButton } from '@/components/share-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAddComment } from '@/features/feed/use-add-comment';
import { CommentComposer } from '@/features/feed/comment-composer';
import { useComments } from '@/features/feed/use-comments';
import { usePost } from '@/features/feed/use-post';
import { useToggleReaction } from '@/features/feed/use-toggle-reaction';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getErrorMessage } from '@/lib/get-error-message';
import { useRedirectIfInvalid } from '@/lib/use-redirect-if-invalid';

const paramsSchema = z.object({ id: z.uuid() });

// How long to keep the list pinned to its end after a sent comment appears.
const FOLLOW_NEW_COMMENT_MS = 1000;

export default function PostDetailScreen() {
  const parsedParams = paramsSchema.safeParse(useLocalSearchParams());
  const postId = parsedParams.success ? parsedParams.data.id : undefined;

  const post = usePost(postId);
  const comments = useComments(postId);
  const addComment = useAddComment();
  const toggleReaction = useToggleReaction();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Comment>>(null);
  // After sending: wait for the refetched list to include the new comment,
  // then follow the end of the list while it lays out (comments are
  // appended, and the list can grow over a few layout passes).
  const scrollToNewComment = useRef<'idle' | 'awaiting-data' | 'following'>('idle');
  const commentCount = comments.data?.length ?? 0;
  const listHeight = useRef(0);
  useRedirectIfInvalid(parsedParams.success, '/home');

  useEffect(() => {
    if (scrollToNewComment.current !== 'awaiting-data') return;
    scrollToNewComment.current = 'following';
    const timer = setTimeout(() => {
      scrollToNewComment.current = 'idle';
    }, FOLLOW_NEW_COMMENT_MS);
    return () => clearTimeout(timer);
  }, [commentCount]);

  if (!parsedParams.success) {
    return null;
  }

  const handleSend = () => {
    const body = draft.trim();
    if (!body || addComment.isPending) return;
    addComment.mutate(
      { post_id: postId!, body },
      {
        onSuccess: () => {
          setDraft('');
          scrollToNewComment.current = 'awaiting-data';
        },
      },
    );
  };

  // Scrolls by the real reported sizes rather than scrollToEnd, which uses
  // FlatList's estimate of not-yet-measured rows and stops short.
  const handleListContentSizeChange = (_width: number, contentHeight: number) => {
    if (scrollToNewComment.current !== 'following') return;
    listRef.current?.scrollToOffset({ offset: Math.max(contentHeight - listHeight.current, 0), animated: true });
  };

  const renderItem = ({ item }: { item: Comment }) => (
    <ThemedView type="backgroundElement" style={styles.comment}>
      <ThemedText type="smallBold">{item.author_display_name ?? item.author_username}</ThemedText>
      <ThemedText>{item.body}</ThemedText>
      <View style={styles.commentFooter}>
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeTime(item.created_at)}
        </ThemedText>
        <ReportButton targetType="comment" targetId={item.id} />
      </View>
    </ThemedView>
  );

  const renderHeader = () => {
    if (post.isLoading) {
      return <ActivityIndicator style={styles.postLoading} />;
    }
    if (!post.data) {
      return (
        <ThemedText type="small" style={styles.postLoading}>
          This post isn&apos;t available.
        </ThemedText>
      );
    }
    return (
      <View style={styles.postHeader}>
        <PostCard
          post={post.data}
          onToggleReaction={() =>
            toggleReaction.mutate({ postId: postId!, isReacted: post.data!.viewer_has_reacted })
          }
          onPressComments={() => {}}
        />
        <View style={styles.postActionsRow}>
          <ShareButton entity="post" id={postId!} title={post.data.body ?? 'a post on VYBE'} />
          <ReportButton targetType="post" targetId={postId!} />
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={listRef}
          onContentSizeChange={handleListContentSizeChange}
          onLayout={(event) => {
            listHeight.current = event.nativeEvent.layout.height;
          }}
          data={comments.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            comments.isLoading ? (
              <ActivityIndicator style={styles.emptyState} />
            ) : (
              <ThemedText type="small" style={styles.emptyState}>
                No comments yet — be the first.
              </ThemedText>
            )
          }
        />

        <CommentComposer
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          isSending={addComment.isPending}
          errorMessage={addComment.isError ? getErrorMessage(addComment.error) : undefined}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { padding: Spacing.three, flexGrow: 1 },
  postHeader: { gap: Spacing.two, marginBottom: Spacing.three },
  postActionsRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  postLoading: { paddingVertical: Spacing.four, textAlign: 'center' },
  comment: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  commentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
});
