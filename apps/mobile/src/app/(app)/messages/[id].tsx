import { liveStreak, MESSAGE_MAX_LENGTH } from '@vybe/shared';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Avatar } from '@/components/avatar';
import { ComposerBar } from '@/components/composer-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useProfileById } from '@/features/discovery/use-profile-by-id';
import { DayDivider, MessageBubble } from '@/features/messages/message-bubble';
import type { ChatMessage } from '@/features/messages/message-cache';
import { useConversation } from '@/features/messages/use-conversation';
import { useMarkConversationRead } from '@/features/messages/use-mark-conversation-read';
import { useMessages } from '@/features/messages/use-messages';
import { useSendMessage } from '@/features/messages/use-send-message';
import { useSession } from '@/lib/auth/session-provider';
import { isSameDay } from '@/lib/format-chat-time';
import { getErrorMessage } from '@/lib/get-error-message';
import { pickPhotos, type LocalPhoto } from '@/lib/media/photo';
import { randomUuid } from '@/lib/random-uuid';
import { useRedirectIfInvalid } from '@/lib/use-redirect-if-invalid';

const paramsSchema = z.object({ id: z.uuid() });

// Messages from one person within this long of each other share one
// timestamp, at the end of the run.
const GROUP_GAP_MS = 5 * 60 * 1000;
const ATTACHMENT_SIZE = 72;

function endsGroup(item: ChatMessage, newer: ChatMessage | undefined): boolean {
  return (
    !newer ||
    newer.sender_id !== item.sender_id ||
    newer.created_at.getTime() - item.created_at.getTime() > GROUP_GAP_MS ||
    !isSameDay(newer.created_at, item.created_at)
  );
}

export default function ChatScreen() {
  const parsedParams = paramsSchema.safeParse(useLocalSearchParams());
  const conversationId = parsedParams.success ? parsedParams.data.id : undefined;
  useRedirectIfInvalid(parsedParams.success, '/messages');

  if (!conversationId) return null;
  return <Chat conversationId={conversationId} />;
}

function Chat({ conversationId }: { conversationId: string }) {
  const { session } = useSession();
  const myId = session?.user.id;
  const conversation = useConversation(conversationId);
  const partnerId = conversation.data
    ? conversation.data.user_a === myId
      ? conversation.data.user_b
      : conversation.data.user_a
    : undefined;
  const partner = useProfileById(partnerId);
  const messages = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const { mutate: markRead } = useMarkConversationRead();
  const [draft, setDraft] = useState('');
  const [photo, setPhoto] = useState<LocalPhoto | null>(null);

  const items = messages.data?.pages.flat() ?? [];
  const partnerName = partner.data?.display_name ?? partner.data?.username ?? '';
  const isUserA = conversation.data?.user_a === myId;
  const myReadAt = (isUserA ? conversation.data?.user_a_read_at : conversation.data?.user_b_read_at) ?? null;
  const partnerReadAt = (isUserA ? conversation.data?.user_b_read_at : conversation.data?.user_a_read_at) ?? null;
  const newestFromPartner = items.find((item) => item.sender_id !== myId);
  const newestMine = items.find((item) => item.sender_id === myId);
  const streak = conversation.data ? liveStreak(conversation.data) : null;

  // Reading the chat marks it read, including messages that arrive while
  // it's open. Stops once the read position has caught up (the update
  // comes back through Realtime as a new conversation row).
  const unreadUntil = newestFromPartner?.created_at.getTime();
  const readUntil = myReadAt?.getTime();
  useEffect(() => {
    if (unreadUntil === undefined || (readUntil !== undefined && readUntil >= unreadUntil)) return;
    markRead(conversationId);
  }, [conversationId, unreadUntil, readUntil, markRead]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body && !photo) return;
    const sentPhoto = photo;
    sendMessage.mutate(
      { id: randomUuid(), conversationId, body: body || undefined, photo: sentPhoto ?? undefined },
      {
        // A failed text comes back to the input so it isn't lost.
        onError: () => {
          if (!sentPhoto) setDraft((current) => current || body);
        },
        // A photo and its caption stay in the composer until they're sent.
        onSuccess: () => {
          if (!sentPhoto) return;
          setPhoto(null);
          setDraft('');
        },
      },
    );
    // Text shows in the chat straight away, so the input clears now.
    if (!sentPhoto) setDraft('');
  };

  const addPhoto = async () => {
    const [picked] = await pickPhotos(1);
    if (picked) setPhoto(picked);
  };

  if (conversation.isSuccess && !conversation.data) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.unavailable}>
          This conversation isn&apos;t available.
        </ThemedText>
      </ThemedView>
    );
  }

  const isUploadingPhoto = sendMessage.isPending && !!sendMessage.variables?.photo;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () =>
            partnerId ? (
              <Pressable
                onPress={() => router.push({ pathname: '/profile/[id]', params: { id: partnerId } })}
                style={styles.title}
                accessibilityRole="button"
                accessibilityLabel={`${partnerName}, view profile`}>
                <Avatar name={partnerName || '?'} uri={partner.data?.avatar_url} size={32} />
                <ThemedText type="smallBold" numberOfLines={1}>
                  {partnerName}
                </ThemedText>
              </Pressable>
            ) : null,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {!!streak?.count && (
          <View style={styles.streak} accessibilityLiveRegion="polite">
            <ThemedText type="smallBold" style={styles.streakLabel}>
              🔥 {streak.count}-day snap streak
            </ThemedText>
            <ThemedText type="small" themeColor={streak.endsTonight ? 'secondary' : 'textSecondary'}>
              {streak.endsTonight ? '⏳ Ends tonight' : 'Kept today'}
            </ThemedText>
          </View>
        )}
        {items.length === 0 && !messages.isLoading ? (
          <View style={styles.emptyState}>
            <Avatar name={partnerName || '?'} uri={partner.data?.avatar_url} size={72} />
            <ThemedText type="subtitle">{partnerName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Say hi and make a plan for tonight.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            inverted
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onEndReachedThreshold={0.3}
            onEndReached={() => {
              if (messages.hasNextPage && !messages.isFetchingNextPage) messages.fetchNextPage();
            }}
            // Inverted: the footer sits at the top, where older messages load.
            ListFooterComponent={
              messages.isLoading || messages.isFetchingNextPage ? <ActivityIndicator style={styles.loading} /> : null
            }
            renderItem={({ item, index }) => {
              const older = items[index + 1];
              const isMine = item.sender_id === myId;
              const isNewestMine = item.id === newestMine?.id;
              // A snap's bubble says Delivered / Opened itself.
              const status = !isNewestMine || item.kind === 'snap'
                ? undefined
                : item.isPending
                  ? 'Sending…'
                  : partnerReadAt && partnerReadAt >= item.created_at
                    ? 'Seen'
                    : 'Sent';
              return (
                <View>
                  {(!older || !isSameDay(older.created_at, item.created_at)) && <DayDivider date={item.created_at} />}
                  <MessageBubble
                    message={item}
                    isMine={isMine}
                    isGroupEnd={endsGroup(item, items[index - 1]) || isNewestMine}
                    status={status}
                    partnerName={partnerName}
                    partnerAvatarUrl={partner.data?.avatar_url}
                  />
                </View>
              );
            }}
          />
        )}

        <ComposerBar
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          isSending={isUploadingPhoto}
          errorMessage={sendMessage.isError ? getErrorMessage(sendMessage.error) : undefined}
          placeholder={partnerName ? `Message ${partnerName.split(' ')[0]}…` : 'Message…'}
          inputLabel="Message"
          sendLabel="Send message"
          maxLength={MESSAGE_MAX_LENGTH}
          hasAttachment={!!photo}
          leading={
            <View style={styles.leading}>
              <Pressable
                onPress={() => partnerId && router.push({ pathname: '/snap/camera', params: { to: partnerId } })}
                disabled={!partnerId}
                hitSlop={4}
                style={[styles.addPhoto, styles.snapButton]}
                accessibilityRole="button"
                accessibilityLabel="Send a snap">
                <SymbolView
                  name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                  size={18}
                  tintColor={Colors.onPrimary}
                />
              </Pressable>
              <Pressable
                onPress={addPhoto}
                disabled={isUploadingPhoto}
                hitSlop={4}
                style={styles.addPhoto}
                accessibilityRole="button"
                accessibilityLabel="Add a photo">
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={20} weight="bold" tintColor={Colors.text} />
              </Pressable>
            </View>
          }
          attachment={
            photo ? (
              <View style={styles.attachment}>
                <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                {!isUploadingPhoto && (
                  <Pressable
                    onPress={() => setPhoto(null)}
                    hitSlop={8}
                    style={styles.removeAttachment}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo">
                    <SymbolView
                      name={{ ios: 'xmark', android: 'close', web: 'close' }}
                      size={12}
                      weight="bold"
                      tintColor={Colors.text}
                    />
                  </Pressable>
                )}
              </View>
            ) : undefined
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const ADD_PHOTO_SIZE = 40;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  title: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, maxWidth: 240 },
  list: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  loading: { paddingVertical: Spacing.three },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  unavailable: { padding: Spacing.five, textAlign: 'center' },
  // The Stitch chat's "Social Streak" bar, under the header.
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  streakLabel: { color: Colors.secondary },
  leading: { flexDirection: 'row', gap: Spacing.one },
  snapButton: { backgroundColor: Colors.secondaryStrong },
  addPhoto: {
    width: ADD_PHOTO_SIZE,
    height: ADD_PHOTO_SIZE,
    borderRadius: ADD_PHOTO_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSelected,
  },
  attachment: {
    width: ATTACHMENT_SIZE,
    height: ATTACHMENT_SIZE,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    marginLeft: Spacing.one,
    backgroundColor: Colors.backgroundSelected,
  },
  removeAttachment: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});
