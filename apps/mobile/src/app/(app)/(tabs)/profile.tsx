import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/event-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, Roundness, Spacing } from '@/constants/theme';
import { ActiveCrewsStrip } from '@/features/home/active-crews-strip';
import { CheckInTimelineItem } from '@/features/profile/check-in-timeline-item';
import { TrophyCase } from '@/features/profile/trophy-case';
import { ProfileHeaderCard } from '@/features/profile/profile-header-card';
import { ProfileStatsSection } from '@/features/profile/profile-stats-section';
import { XpLedgerRow } from '@/features/profile/xp-ledger-row';
import { useMyBadges } from '@/features/gamification/use-my-badges';
import { useMyOutsideStreak } from '@/features/gamification/use-my-streak';
import { useMyXpTotal } from '@/features/gamification/use-my-xp-total';
import { useMyRecentXp } from '@/features/gamification/use-my-recent-xp';
import { useMyCrews } from '@/features/crews/use-my-crews';
import { useMyCheckIns } from '@/features/profile/use-my-check-ins';
import { useMyCity } from '@/features/profile/use-my-city';
import { useMyEventRsvps } from '@/features/profile/use-my-event-rsvps';
import { useMyOutsideNow } from '@/features/profile/use-my-outside-now';
import { useMyProfileStats } from '@/features/profile/use-my-profile-stats';
import { useProfile } from '@/features/profile/use-profile';

const PROFILE_TABS = ['check-ins', 'events', 'crews', 'activity'] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];
const PROFILE_TAB_LABELS: Record<ProfileTab, string> = {
  'check-ins': 'Check-ins',
  events: 'Events',
  crews: 'My Crews',
  activity: 'Activity',
};

export default function ProfileScreen() {
  const [tab, setTab] = useState<ProfileTab>('check-ins');
  const { data: profile, isLoading } = useProfile();
  const { data: city } = useMyCity();
  const { data: isOutsideNow } = useMyOutsideNow();
  const { data: xpTotal } = useMyXpTotal();
  const { data: streak } = useMyOutsideStreak();
  const { data: stats } = useMyProfileStats();
  const { data: badges } = useMyBadges();
  const checkIns = useMyCheckIns();
  const eventRsvps = useMyEventRsvps();
  const myCrews = useMyCrews();
  const recentXp = useMyRecentXp();

  if (isLoading || !profile) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator style={styles.loading} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.three }]}>
          <ProfileHeaderCard profile={profile} cityName={city?.name} isOutsideNow={isOutsideNow ?? false} />
          <ProfileStatsSection totalXp={xpTotal ?? 0} streakCurrentCount={streak?.current_count ?? 0} stats={stats} />
          <TrophyCase badges={badges ?? []} />

          <View style={styles.tabBar}>
            {PROFILE_TABS.map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={styles.tabButtonWrap}>
                <View style={[styles.tabButton, tab === t && styles.tabButtonActive]}>
                  <ThemedText type="smallBold" themeColor={tab === t ? 'onPrimary' : 'textSecondary'}>
                    {PROFILE_TAB_LABELS[t]}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>

          {tab === 'check-ins' && (
            <View style={styles.tabContent}>
              {checkIns.isLoading ? (
                <ActivityIndicator style={styles.emptyState} />
              ) : (checkIns.data ?? []).length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyState}>
                  No check-ins yet.
                </ThemedText>
              ) : (
                checkIns.data!.map((checkIn) => <CheckInTimelineItem key={checkIn.id} checkIn={checkIn} />)
              )}
            </View>
          )}

          {tab === 'events' && (
            <View style={styles.tabContent}>
              {eventRsvps.isLoading ? (
                <ActivityIndicator style={styles.emptyState} />
              ) : (eventRsvps.data ?? []).length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyState}>
                  No upcoming RSVPs yet.
                </ThemedText>
              ) : (
                eventRsvps.data!.map((event) => (
                  <EventCard key={event.id} event={event} onPress={() => router.push({ pathname: '/(app)/event/[id]', params: { id: event.id } })} />
                ))
              )}
            </View>
          )}

          {tab === 'crews' && (
            <View style={styles.tabContent}>
              {myCrews.isLoading ? (
                <ActivityIndicator style={styles.emptyState} />
              ) : (
                <ActiveCrewsStrip crews={myCrews.data ?? []} limit={Number.POSITIVE_INFINITY} />
              )}
            </View>
          )}

          {tab === 'activity' && (
            <View style={styles.tabContent}>
              {recentXp.isLoading ? (
                <ActivityIndicator style={styles.emptyState} />
              ) : (recentXp.data ?? []).length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyState}>
                  No activity yet.
                </ThemedText>
              ) : (
                recentXp.data!.map((transaction) => <XpLedgerRow key={transaction.id} transaction={transaction} />)
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
  loading: { marginTop: Spacing.six },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.four, paddingTop: Spacing.two },
  tabBar: { flexDirection: 'row', gap: 4, borderRadius: Roundness.pill, padding: 4, backgroundColor: 'rgba(0,0,0,0.2)' },
  tabButtonWrap: { flex: 1 },
  tabButton: { borderRadius: Roundness.pill, paddingVertical: Spacing.two, alignItems: 'center' },
  tabButtonActive: { backgroundColor: Colors.primary },
  tabContent: { gap: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
});
