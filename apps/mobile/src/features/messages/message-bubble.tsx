import { CHAT_MEDIA_BUCKET } from '@vybe/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { PhotoViewer } from '@/components/photo-viewer';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { formatDayLabel, formatMessageTime } from '@/lib/format-chat-time';
import { useSignedUrls } from '@/lib/media/storage';

import type { ChatMessage } from './message-cache';

const PHOTO_WIDTH = 220;
const PARTNER_AVATAR_SIZE = 28;

function photoHeight(message: ChatMessage): number {
  if (!message.media_width || !message.media_height) return PHOTO_WIDTH;
  const ratio = Math.min(Math.max(message.media_height / message.media_width, 0.75), 1.33);
  return Math.round(PHOTO_WIDTH * ratio);
}

function ChatPhoto({ message }: { message: ChatMessage }) {
  const path = message.media_path!;
  const { data: urls } = useSignedUrls(CHAT_MEDIA_BUCKET, [path]);
  const [isOpen, setIsOpen] = useState(false);
  const url = urls?.[path];

  return (
    <>
      <Pressable onPress={() => setIsOpen(true)} accessibilityRole="button" accessibilityLabel="Open photo">
        <Image
          source={url ? { uri: url, cacheKey: path } : undefined}
          style={[styles.photo, { height: photoHeight(message) }]}
          contentFit="cover"
          transition={150}
        />
      </Pressable>
      {isOpen && <PhotoViewer photos={[{ key: path, url }]} initialIndex={0} onClose={() => setIsOpen(false)} />}
    </>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  /** Last message of a run from the same person: shows the time (and their avatar). */
  isGroupEnd: boolean;
  /** Under your newest message: Sending… / Sent / Seen. */
  status?: string;
  partnerName: string;
  partnerAvatarUrl: string | null | undefined;
}

export function MessageBubble({ message, isMine, isGroupEnd, status, partnerName, partnerAvatarUrl }: MessageBubbleProps) {
  const isPhoto = message.kind === 'photo' && !!message.media_path;
  const time = formatMessageTime(message.created_at);

  return (
    <View
      style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs, isGroupEnd && styles.rowGroupEnd]}
      accessible
      accessibilityLabel={`${isMine ? 'You' : partnerName}, ${time}: ${isPhoto ? 'Photo' : ''}${message.body ? ` ${message.body}` : ''}${status ? `. ${status}` : ''}`}>
      {!isMine && (
        <View style={styles.avatarSlot}>
          {isGroupEnd && <Avatar name={partnerName} uri={partnerAvatarUrl} size={PARTNER_AVATAR_SIZE} />}
        </View>
      )}
      <View style={[styles.column, isMine ? styles.columnMine : styles.columnTheirs]}>
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
            isGroupEnd && (isMine ? styles.tailMine : styles.tailTheirs),
            isPhoto && styles.bubblePhoto,
            message.isPending && styles.pending,
          ]}>
          {isPhoto && <ChatPhoto message={message} />}
          {!!message.body && (
            <ThemedText style={[styles.body, isMine && styles.bodyMine, isPhoto && styles.caption]}>
              {message.body}
            </ThemedText>
          )}
        </View>
        {isGroupEnd && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
            {time}
            {status ? ` · ${status}` : ''}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

/** "TODAY • 8:15 PM" above the first message of each day. */
export function DayDivider({ date }: { date: Date }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divider}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.dividerLabel}>
          {formatDayLabel(date).toUpperCase()} • {formatMessageTime(date)}
        </ThemedText>
      </View>
    </View>
  );
}

const RADIUS = 20;
const TAIL_RADIUS = 6;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, marginTop: 2 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  rowGroupEnd: { marginBottom: Spacing.two },
  avatarSlot: { width: PARTNER_AVATAR_SIZE, marginBottom: 22 },
  column: { maxWidth: '78%', gap: Spacing.half },
  columnMine: { alignItems: 'flex-end' },
  columnTheirs: { alignItems: 'flex-start' },
  bubble: { borderRadius: RADIUS, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: Colors.primary },
  bubbleTheirs: { backgroundColor: Colors.backgroundElement },
  tailMine: { borderBottomRightRadius: TAIL_RADIUS },
  tailTheirs: { borderBottomLeftRadius: TAIL_RADIUS },
  bubblePhoto: { padding: 4, overflow: 'hidden' },
  pending: { opacity: 0.6 },
  photo: { width: PHOTO_WIDTH, borderRadius: RADIUS - 4, backgroundColor: Colors.backgroundSelected },
  body: { fontSize: 15, lineHeight: 21 },
  bodyMine: { color: Colors.onPrimary },
  caption: { paddingHorizontal: 10, paddingTop: Spacing.one, paddingBottom: Spacing.one },
  meta: { fontSize: 11, paddingHorizontal: Spacing.one },
  dividerRow: { alignItems: 'center', marginVertical: Spacing.three },
  divider: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    backgroundColor: Colors.backgroundElement,
  },
  dividerLabel: { fontSize: 11, letterSpacing: 0.6 },
});
