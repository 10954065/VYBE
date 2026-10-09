import type { Crew } from '@vybe/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CrewCard } from '@/components/crew-card';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { ActiveCrewsStrip } from '@/features/home/active-crews-strip';
import { useMyCrews } from '@/features/crews/use-my-crews';
import { useCrews } from '@/features/crews/use-crews';
import { useRecommendedCrews } from '@/features/discovery/use-recommended-crews';
import { useCityLeaderboard } from '@/features/crews/use-leaderboard';
import { useActiveChallenge } from '@/features/crews/use-active-challenge';
import { ChallengeBanner } from '@/features/crews/challenge-banner';
import { LeaderboardRow } from '@/features/crews/leaderboard-row';
import { useSession } from '@/lib/auth/session-provider';
import { getErrorMessage } from '@/lib/get-error-message';

const SUB_TABS = ['my-crews', 'explore', 'leaderboard'] as const;
type SubTab = (typeof SUB_TABS)[number];
const SUB_TAB_LABELS: Record<SubTab, string> = { 'my-crews': 'My Crews', explore: 'Explore', leaderboard: 'City Board' };

const CREW_EXPLORE_SORTS = ['all', 'for_you'] as const;
type CrewExploreSort = (typeof CREW_EXPLORE_SORTS)[number];
const CREW_EXPLORE_SORT_LABELS: Record<CrewExploreSort, string> = { all: 'All', for_you: 'For You' };

export default function CrewsScreen() {
  const [tab, setTab] = useState<SubTab>('my-crews');
  const [crewExploreSort, setCrewExploreSort] = useState<CrewExploreSort>('all');
  const { session } = useSession();
  const myCrews = useMyCrews();
  const isCrewsForYou = tab === 'explore' && crewExploreSort === 'for_you';
  const allCrews = useCrews();
  const recommendedCrews = useRecommendedCrews(isCrewsForYou);
  const exploreCrews = isCrewsForYou ? recommendedCrews : allCrews;
  const leaderboard = useCityLeaderboard();
  const activeChallenge = useActiveChallenge();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.subNav}>
          {SUB_TABS.map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.subNavButton}>
              <ThemedView type={tab === t ? 'backgroundSelected' : 'backgroundElement'} style={styles.subNavPill}>
                <ThemedText type="smallBold" themeColor={tab === t ? 'primary' : 'textSecondary'}>
                  {SUB_TAB_LABELS[t]}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))}
          {tab === 'explore' && <ThemedButton title="+ New" variant="ghost" onPress={() => router.push('/crew/create')} />}
        </View>

        {tab === 'my-crews' && (
          <ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}>
            <View style={styles.section}>
              {activeChallenge.data && <ChallengeBanner challenge={activeChallenge.data} />}
              <View style={styles.sectionHeaderRow}>
                <ThemedText type="subtitle">Your Active Crews</ThemedText>
              </View>
              {myCrews.isLoading ? (
                <ActivityIndicator style={styles.emptyState} />
              ) : (
                <ActiveCrewsStrip crews={myCrews.data ?? []} limit={Number.POSITIVE_INFINITY} emptyHint="You haven't joined a crew yet — try the Explore tab above." />
              )}
            </View>
          </ScrollView>
        )}

        {tab === 'explore' && (
          <>
            <View style={styles.chipRow}>
              {CREW_EXPLORE_SORTS.map((sort) => (
                <Pressable key={sort} onPress={() => setCrewExploreSort(sort)}>
                  <ThemedView type={crewExploreSort === sort ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                    <ThemedText type="small">{CREW_EXPLORE_SORT_LABELS[sort]}</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>
            <FlatList
              data={exploreCrews.data ?? []}
              keyExtractor={(item: Crew) => item.id}
              renderItem={({ item }) => (
                <CrewCard
                  crew={item}
                  onPress={() => router.push({ pathname: '/(app)/crew/[id]', params: { id: item.id } })}
                />
              )}
              contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                exploreCrews.isLoading ? (
                  <ActivityIndicator style={styles.emptyState} />
                ) : (
                  <ThemedText type="small" style={styles.emptyState}>
                    {exploreCrews.isError
                      ? getErrorMessage(exploreCrews.error)
                      : isCrewsForYou
                        ? 'No recommendations yet — follow some friends first.'
                        : 'No crews in your city yet — start one.'}
                  </ThemedText>
                )
              }
            />
          </>
        )}

        {tab === 'leaderboard' && (
          <FlatList
            data={leaderboard.data ?? []}
            keyExtractor={(item) => item.user_id}
            renderItem={({ item }) => <LeaderboardRow entry={item} isViewer={item.user_id === session?.user.id} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: BottomTabInset + Spacing.three }]}
            ListEmptyComponent={
              leaderboard.isLoading ? (
                <ActivityIndicator style={styles.emptyState} />
              ) : (
                <ThemedText type="small" style={styles.emptyState}>
                  {leaderboard.isError ? getErrorMessage(leaderboard.error) : 'No one on the board yet.'}
                </ThemedText>
              )
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  subNav: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  subNavButton: { flex: 1 },
  subNavPill: { borderRadius: Spacing.four, paddingVertical: Spacing.two, alignItems: 'center' },
  chipRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  chip: { borderRadius: Spacing.four, paddingHorizontal: Spacing.two, paddingVertical: 6 },
  listContent: { paddingHorizontal: Spacing.three },
  section: { gap: Spacing.three },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
});
