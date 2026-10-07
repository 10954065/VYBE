import type { Comment } from '@vybe/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAddComment } from '@/features/feed/use-add-comment';
import { useComments } from '@/features/feed/use-comments';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getErrorMessage } from '@/lib/get-error-message';

const paramsSchema = z.object({ id: z.uuid() });

export default function PostDetailScreen() {
  const parsedParams = paramsSchema.safeParse(useLocalSearchParams());
  const postId = parsedParams.success ? parsedParams.data.id : undefined;

  const comments = useComments(postId);
  const addComment = useAddComment();
  const [draft, setDraft] = useState('');

  if (!parsedParams.success) {
    router.replace('/home');
    return null;
  }

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    addComment.mutate({ post_id: postId!, body }, { onSuccess: () => setDraft('') });
  };

  const renderItem = ({ item }: { item: Comment }) => (
    <ThemedView type="backgroundElement" style={styles.comment}>
      <ThemedText type="smallBold">{item.author_display_name ?? item.author_username}</ThemedText>
      <ThemedText>{item.body}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {formatRelativeTime(item.created_at)}
      </ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={comments.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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

        <View style={styles.composerRow}>
          <ThemedView type="backgroundElement" style={styles.composer}>
            <ThemedTextInput
              placeholder="Add a comment…"
              value={draft}
              onChangeText={setDraft}
              style={styles.input}
            />
            <ThemedButton title="Send" onPress={handleSend} loading={addComment.isPending} disabled={!draft.trim()} />
          </ThemedView>
          {addComment.isError && <ThemedText type="small">{getErrorMessage(addComment.error)}</ThemedText>}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { padding: Spacing.three, flexGrow: 1 },
  comment: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
  composerRow: { gap: Spacing.one, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  composer: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three, alignItems: 'center' },
  input: { flex: 1 },
});
