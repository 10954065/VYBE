import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

import { useUnreadConversationCount } from './use-inbox';

/** The paper-plane button on Home that opens the inbox, with an unread badge. */
export function MessagesButton() {
  const { data: unreadCount } = useUnreadConversationCount();

  return (
    <Pressable
      onPress={() => router.push('/messages')}
      hitSlop={8}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={unreadCount ? `Messages, ${unreadCount} unread` : 'Messages'}>
      <SymbolView
        name={{ ios: 'paperplane', android: 'send', web: 'send' }}
        size={22}
        tintColor={Colors.text}
      />
      {!!unreadCount && (
        <View style={styles.badge}>
          <ThemedText type="small" style={styles.badgeLabel}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeLabel: { fontSize: 10, lineHeight: 12, color: Colors.onPrimary },
});
