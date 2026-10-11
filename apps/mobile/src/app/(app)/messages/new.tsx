import type { MessageContact } from '@vybe/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useMessageContacts, useStartConversation } from '@/features/messages/use-start-conversation';
import { getErrorMessage } from '@/lib/get-error-message';

function matches(contact: MessageContact, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    contact.username.toLowerCase().includes(needle) || (contact.display_name ?? '').toLowerCase().includes(needle)
  );
}

export default function NewMessageScreen() {
  const contacts = useMessageContacts();
  const startConversation = useStartConversation();
  const [query, setQuery] = useState('');
  const visible = (contacts.data ?? []).filter((contact) => matches(contact, query));

  const open = (contact: MessageContact) => {
    startConversation.mutate(contact.id, {
      onSuccess: (conversationId) => router.replace({ pathname: '/messages/[id]', params: { id: conversationId } }),
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.search}>
          <ThemedTextInput
            placeholder="Search people who follow you"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {startConversation.isError && (
            <ThemedText type="small" style={styles.error}>
              {getErrorMessage(startConversation.error)}
            </ThemedText>
          )}
        </View>
        <FlatList
          data={visible}
          keyExtractor={(contact) => contact.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const name = item.display_name ?? item.username;
            return (
              <Pressable
                onPress={() => open(item)}
                disabled={startConversation.isPending}
                accessibilityRole="button"
                accessibilityLabel={`Message ${name}`}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <Avatar name={name} uri={item.avatar_url} size={44} />
                <View style={styles.rowText}>
                  <ThemedText type="smallBold">{name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    @{item.username}
                    {item.is_friend ? ' · Friend' : ''}
                  </ThemedText>
                </View>
                {startConversation.isPending && startConversation.variables === item.id && <ActivityIndicator />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            contacts.isLoading ? (
              <ActivityIndicator style={styles.empty} />
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {query
                  ? 'Nobody by that name follows you.'
                  : 'Nobody follows you yet. Once people follow you, you can message them here.'}
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
  search: { padding: Spacing.three, gap: Spacing.two },
  error: { color: Colors.danger },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowPressed: { backgroundColor: Colors.backgroundElement },
  rowText: { flex: 1, gap: Spacing.half },
  empty: { padding: Spacing.five, textAlign: 'center' },
});
