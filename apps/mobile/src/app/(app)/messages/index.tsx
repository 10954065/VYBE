import type { InboxEntry } from '@vybe/shared';
import { router, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useInbox } from '@/features/messages/use-inbox';
import { useSession } from '@/lib/auth/session-provider';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getErrorMessage } from '@/lib/get-error-message';

function preview(entry: InboxEntry, myId: string | undefined): string {
  if (entry.unopened_snap_count > 0) {
    return entry.unopened_snap_count > 1 ? `📸 ${entry.unopened_snap_count} new snaps` : '📸 New snap';
  }
  const isMine = entry.last_message_sender_id === myId;
  if (entry.last_message_kind === 'snap') {
    if (!isMine) return 'Opened a snap';
    return entry.last_message_opened_at ? 'You sent a snap · Opened' : 'You sent a snap · Delivered';
  }
  const text = entry.last_message_kind === 'photo' ? '📷 Photo' : (entry.last_message_body ?? '');
  return isMine ? `You: ${text}` : text;
}

function streakLabel(entry: InboxEntry): string | null {
  if (entry.streak_count === 0) return null;
  return `🔥 ${entry.streak_count}${entry.streak_expires_today ? ' ⏳' : ''}`;
}

function InboxRow({ entry, myId }: { entry: InboxEntry; myId: string | undefined }) {
  const name = entry.partner_display_name ?? entry.partner_username;
  const isUnread = entry.unread_count > 0;
  const hasNewSnap = entry.unopened_snap_count > 0;
  const streak = streakLabel(entry);
  const streakDescription = streak
    ? `, ${entry.streak_count}-day streak${entry.streak_expires_today ? ' ending tonight' : ''}`
    : '';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/messages/[id]', params: { id: entry.conversation_id } })}
      accessibilityRole="button"
      accessibilityLabel={`${name}${streakDescription}${isUnread ? `, ${entry.unread_count} unread` : ''}. ${preview(entry, myId)}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Avatar name={name} uri={entry.partner_avatar_url} size={52} />
      <View style={styles.rowText}>
        <View style={styles.rowTop}>
          <ThemedText type={isUnread ? 'smallBold' : 'default'} numberOfLines={1} style={styles.name}>
            {name}
          </ThemedText>
          {!!streak && (
            <ThemedText type="smallBold" themeColor="secondary">
              {streak}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor="textSecondary">
            {formatRelativeTime(entry.last_message_at)}
          </ThemedText>
        </View>
        <View style={styles.rowBottom}>
          <ThemedText
            type={isUnread ? 'smallBold' : 'small'}
            themeColor={isUnread ? 'text' : 'textSecondary'}
            numberOfLines={1}
            style={[styles.preview, hasNewSnap && styles.newSnap]}>
            {preview(entry, myId)}
          </ThemedText>
          {isUnread && (
            <View style={styles.unread}>
              <ThemedText type="small" style={styles.unreadLabel}>
                {entry.unread_count > 99 ? '99+' : entry.unread_count}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function InboxScreen() {
  const { session } = useSession();
  const inbox = useInbox();
  const myId = session?.user.id;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/messages/new')}
              hitSlop={8}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="New message">
              <SymbolView
                name={{ ios: 'square.and.pencil', android: 'edit_square', web: 'edit_square' }}
                size={22}
                tintColor={Colors.primary}
              />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          data={inbox.data ?? []}
          keyExtractor={(entry) => entry.conversation_id}
          renderItem={({ item }) => <InboxRow entry={item} myId={myId} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={inbox.isRefetching} onRefresh={() => inbox.refetch()} />}
          ListEmptyComponent={
            inbox.isLoading ? (
              <ActivityIndicator style={styles.empty} />
            ) : inbox.isError ? (
              <ThemedText type="small" style={styles.empty}>
                {getErrorMessage(inbox.error)}
              </ThemedText>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText type="subtitle" style={styles.emptyHint}>
                  No messages yet
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
                  Message anyone who follows you, and plan the night together.
                </ThemedText>
                <ThemedButton title="Start a chat" onPress={() => router.push('/messages/new')} />
              </View>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButton: { paddingHorizontal: Spacing.two },
  safeArea: { flex: 1 },
  list: { paddingVertical: Spacing.two, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowPressed: { backgroundColor: Colors.backgroundElement },
  rowText: { flex: 1, gap: Spacing.half },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { flex: 1 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  preview: { flex: 1 },
  newSnap: { color: Colors.secondaryStrong },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  unreadLabel: { fontSize: 11, lineHeight: 14, color: Colors.onPrimary },
  empty: { paddingVertical: Spacing.five, textAlign: 'center' },
  emptyState: { alignItems: 'stretch', gap: Spacing.three, padding: Spacing.four, marginTop: Spacing.five },
  emptyHint: { textAlign: 'center' },
});
