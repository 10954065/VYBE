import type { FeedPost } from '@vybe/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { SuggestedPeopleStrip } from '@/components/suggested-people-strip';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCreatePost } from '@/features/feed/use-create-post';
import { useHomeFeed } from '@/features/feed/use-home-feed';
import { useToggleReaction } from '@/features/feed/use-toggle-reaction';
import { getErrorMessage } from '@/lib/get-error-message';

export default function HomeScreen() {
  const feed = useHomeFeed();
  const createPost = useCreatePost();
  const toggleReaction = useToggleReaction();
  const [draft, setDraft] = useState('');

  const posts = feed.data?.pages.flat() ?? [];

  const handlePost = () => {
    const body = draft.trim();
    if (!body) return;
    createPost.mutate({ body, visibility: 'everyone' }, { onSuccess: () => setDraft('') });
  };

  const renderItem = ({ item }: { item: FeedPost }) => (
    <PostCard
      post={item}
      onToggleReaction={() => toggleReaction.mutate({ postId: item.id, isReacted: item.viewer_has_reacted })}
      onPressComments={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
          }}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <ThemedView type="backgroundElement" style={styles.composer}>
                <ThemedTextInput
                  placeholder="What's happening?"
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  autoCapitalize="sentences"
                />
                {createPost.isError && <ThemedText type="small">{getErrorMessage(createPost.error)}</ThemedText>}
                <ThemedButton
                  title="Post"
                  onPress={handlePost}
                  loading={createPost.isPending}
                  disabled={!draft.trim()}
                />
              </ThemedView>
              <SuggestedPeopleStrip />
            </View>
          }
          ListEmptyComponent={
            feed.isLoading ? (
              <ActivityIndicator style={styles.emptyState} />
            ) : (
              <ThemedText type="small" style={styles.emptyState}>
                {feed.isError
                  ? getErrorMessage(feed.error)
                  : 'Nothing here yet — follow people above or share the first post.'}
              </ThemedText>
            )
          }
          ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : null}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.three },
  headerSection: { gap: Spacing.three, paddingBottom: Spacing.three },
  composer: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
  footer: { paddingVertical: Spacing.three },
});
