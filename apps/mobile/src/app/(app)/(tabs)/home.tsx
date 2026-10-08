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
import { ActiveCrewsStrip } from '@/features/home/active-crews-strip';
import { useCityOutsideCount } from '@/features/home/use-city-outside-count';
import { useHighlightEvents } from '@/features/home/use-highlight-events';
import { usePeopleOutsideNow } from '@/features/home/use-people-outside-now';
import { HighlightEventCard } from '@/features/events/event-highlight-card';
import { GamificationCard } from '@/features/home/gamification-card';
import { OutsideNowStrip } from '@/features/home/outside-now-strip';
import { useMyCrews } from '@/features/crews/use-my-crews';
import { useMyOutsideStreak } from '@/features/gamification/use-my-streak';
import { useMyXpTotal } from '@/features/gamification/use-my-xp-total';
import { NotificationBell } from '@/features/notifications/notification-bell';
import { useProfile } from '@/features/profile/use-profile';
import { getErrorMessage } from '@/lib/get-error-message';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const feed = useHomeFeed();
  const createPost = useCreatePost();
  const toggleReaction = useToggleReaction();
  const [draft, setDraft] = useState('');

  const { data: profile } = useProfile();
  const { data: cityOutsideCount } = useCityOutsideCount();
  const { data: peopleOutside } = usePeopleOutsideNow();
  const { data: xpTotal } = useMyXpTotal();
  const { data: streak } = useMyOutsideStreak();
  const { data: highlightEvents } = useHighlightEvents();
  const { data: myCrews } = useMyCrews();

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
              <View style={styles.heroSection}>
                <View style={styles.heroRow}>
                  <ThemedText type="title" style={styles.heroGreeting}>
                    {greeting()}, {profile?.display_name ?? profile?.username} 👋
                  </ThemedText>
                  <NotificationBell />
                </View>
                {!!cityOutsideCount && (
                  <ThemedText type="small" themeColor="textSecondary">
                    Accra is buzzing tonight • <ThemedText themeColor="tertiary">{cityOutsideCount} people outside</ThemedText>
                  </ThemedText>
                )}
              </View>

              <View style={styles.section}>
                <ThemedText type="subtitle">People are outside</ThemedText>
                <OutsideNowStrip people={peopleOutside ?? []} />
              </View>

              <GamificationCard totalXp={xpTotal ?? 0} streakCurrentCount={streak?.current_count ?? 0} />

              {!!highlightEvents?.length && (
                <View style={styles.section}>
                  <ThemedText type="subtitle">Happening Tonight</ThemedText>
                  {highlightEvents.map((event) => (
                    <HighlightEventCard key={event.id} event={event} />
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <ThemedText type="subtitle">Your Active Crews</ThemedText>
                <ActiveCrewsStrip crews={myCrews ?? []} />
              </View>

              <View style={styles.section}>
                <ThemedText type="subtitle">From people you follow</ThemedText>
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
  headerSection: { gap: Spacing.four, paddingBottom: Spacing.three, paddingTop: Spacing.two },
  heroSection: { gap: Spacing.one },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroGreeting: { flex: 1 },
  section: { gap: Spacing.two },
  composer: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
  footer: { paddingVertical: Spacing.three },
});
