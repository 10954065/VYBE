import type { BlockedUser } from '@vybe/shared';
import { Image } from 'expo-image';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Roundness, Spacing } from '@/constants/theme';
import { useMyBlocks } from '@/features/moderation/use-my-blocks';
import { useToggleBlock } from '@/features/moderation/use-toggle-block';

function BlockedUserRow({ user }: { user: BlockedUser }) {
  const toggleBlock = useToggleBlock();

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <ThemedText type="smallBold">{(user.display_name ?? user.username)[0]?.toUpperCase()}</ThemedText>
        </View>
      )}
      <View style={styles.rowInfo}>
        <ThemedText type="smallBold">{user.display_name ?? user.username}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          @{user.username}
        </ThemedText>
      </View>
      <ThemedButton
        title="Unblock"
        variant="ghost"
        loading={toggleBlock.isPending && toggleBlock.variables?.target_user_id === user.id}
        onPress={() => toggleBlock.mutate({ target_user_id: user.id, is_blocked: true })}
      />
    </ThemedView>
  );
}

export default function BlockedUsersScreen() {
  const blocks = useMyBlocks();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={blocks.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BlockedUserRow user={item} />}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            blocks.isLoading ? (
              <ActivityIndicator style={styles.emptyState} />
            ) : (
              <ThemedText type="small" style={styles.emptyState}>
                You haven&apos;t blocked anyone.
              </ThemedText>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { padding: Spacing.three, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderRadius: Spacing.three, padding: Spacing.three },
  rowInfo: { flex: 1, gap: 2 },
  avatar: { width: 44, height: 44, borderRadius: Roundness.pill },
  avatarFallback: { backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  separator: { height: Spacing.two },
  emptyState: { paddingVertical: Spacing.five, textAlign: 'center' },
});
