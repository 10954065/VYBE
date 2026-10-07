import type { FeedPost } from '@vybe/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/format-relative-time';

interface PostCardProps {
  post: FeedPost;
  onToggleReaction: () => void;
  onPressComments: () => void;
}

export function PostCard({ post, onToggleReaction, onPressComments }: PostCardProps) {
  const name = post.author_display_name ?? post.author_username;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="smallBold">{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          @{post.author_username} · {formatRelativeTime(post.created_at)}
        </ThemedText>
      </View>

      {post.body && <ThemedText>{post.body}</ThemedText>}

      <View style={styles.actions}>
        <Pressable
          onPress={onToggleReaction}
          hitSlop={8}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={post.viewer_has_reacted ? 'Remove like' : 'Like post'}>
          <ThemedText type="small" themeColor={post.viewer_has_reacted ? 'text' : 'textSecondary'}>
            {post.viewer_has_reacted ? '♥' : '♡'} {post.reaction_count}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={onPressComments}
          hitSlop={8}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={`View ${post.comment_count} comments`}>
          <ThemedText type="small" themeColor="textSecondary">
            💬 {post.comment_count}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: { gap: Spacing.half },
  actions: { flexDirection: 'row', gap: Spacing.four },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
