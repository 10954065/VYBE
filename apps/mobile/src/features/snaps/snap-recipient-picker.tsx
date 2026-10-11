import { SNAP_MAX_RECIPIENTS, type SnapRecipient } from '@vybe/shared';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamily, Glow, Roundness, Spacing } from '@/constants/theme';

interface SnapRecipientPickerProps {
  recipients: SnapRecipient[] | undefined;
  isLoading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onBack: () => void;
  onSend: () => void;
  isSending: boolean;
  errorMessage?: string;
}

/** Who gets the snap: friends with streaks first, up to 15 at once. */
export function SnapRecipientPicker({
  recipients,
  isLoading,
  selectedIds,
  onToggle,
  onBack,
  onSend,
  isSending,
  errorMessage,
}: SnapRecipientPickerProps) {
  const isFull = selectedIds.length >= SNAP_MAX_RECIPIENTS;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to the snap">
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor={Colors.text}
          />
        </Pressable>
        <ThemedText type="subtitle">Send to…</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={recipients ?? []}
        keyExtractor={(recipient) => recipient.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const name = item.display_name ?? item.username;
          const isSelected = selectedIds.includes(item.id);
          return (
            <Pressable
              onPress={() => onToggle(item.id)}
              disabled={isSending || (!isSelected && isFull)}
              accessibilityRole="checkbox"
              aria-checked={isSelected}
              accessibilityLabel={`${name}${item.streak_count ? `, ${item.streak_count}-day streak` : ''}`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <Avatar name={name} uri={item.avatar_url} size={44} />
              <View style={styles.rowText}>
                <ThemedText type="smallBold">{name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  @{item.username}
                </ThemedText>
              </View>
              {item.streak_count > 0 && <Text style={styles.streak}>🔥 {item.streak_count}</Text>}
              <View style={[styles.check, isSelected && styles.checkOn]}>
                {isSelected && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={14}
                    weight="bold"
                    tintColor={Colors.onPrimary}
                  />
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.empty} />
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Nobody follows you yet. Snaps go to people who follow you.
            </ThemedText>
          )
        }
      />

      <View style={styles.footer}>
        {!!errorMessage && (
          <ThemedText type="small" style={styles.error} accessibilityLiveRegion="polite">
            {errorMessage}
          </ThemedText>
        )}
        <Pressable
          onPress={onSend}
          disabled={selectedIds.length === 0 || isSending}
          style={({ pressed }) => [styles.send, selectedIds.length === 0 && styles.sendIdle, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={selectedIds.length ? `Send to ${selectedIds.length}` : 'Choose who to send it to'}
          aria-busy={isSending}>
          {isSending ? (
            <ActivityIndicator color={Colors.onPrimary} />
          ) : (
            <Text style={styles.sendLabel}>
              {selectedIds.length ? `Send to ${selectedIds.length}` : 'Choose friends'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const CHECK_SIZE = 24;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerSpacer: { width: 22 },
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
  streak: { color: Colors.secondary, fontFamily: FontFamily.bold, fontSize: 14 },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  empty: { padding: Spacing.five, textAlign: 'center' },
  footer: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
  error: { color: Colors.danger },
  send: {
    height: 52,
    borderRadius: Roundness.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    ...Glow.primary,
  },
  sendIdle: { backgroundColor: Colors.backgroundSelected, shadowOpacity: 0, elevation: 0 },
  sendLabel: { color: Colors.onPrimary, fontFamily: FontFamily.bold, fontSize: 16 },
  pressed: { opacity: 0.85 },
});
