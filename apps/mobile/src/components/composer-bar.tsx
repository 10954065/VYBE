import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamily, Glow, Roundness, Spacing } from '@/constants/theme';

const SEND_BUTTON_SIZE = 40;
const MIN_INPUT_HEIGHT = SEND_BUTTON_SIZE;
const MAX_INPUT_HEIGHT = 120;
// A web textarea defaults to two rows; native multiline inputs start at one
// line and grow. `rows` is React Native Web-only, so it isn't in RN's types.
const WEB_SINGLE_ROW = Platform.OS === 'web' ? ({ rows: 1 } as object) : {};
// Chromium still draws its focus ring at outline-width 0 (outline-style is
// "auto"); RN's style types don't allow 'none', so it's set web-only.
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

export interface ComposerBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  errorMessage?: string;
  placeholder: string;
  /** Screen-reader name of the text field. */
  inputLabel: string;
  /** Screen-reader name of the send button. */
  sendLabel: string;
  maxLength: number;
  /** Shown inside the pill, before the text field (e.g. an add-photo button). */
  leading?: ReactNode;
  /** Shown above the pill (e.g. a photo about to be sent). */
  attachment?: ReactNode;
  /** Lets the message go without text, when there's an attachment. */
  hasAttachment?: boolean;
}

/**
 * The bar pinned under a conversation or a post's comments: one pill
 * holding a growing input and a round send button. Rides up with the
 * keyboard, which otherwise covers it on iOS.
 */
export function ComposerBar({
  value,
  onChangeText,
  onSend,
  isSending,
  errorMessage,
  placeholder,
  inputLabel,
  sendLabel,
  maxLength,
  leading,
  attachment,
  hasAttachment = false,
}: ComposerBarProps) {
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const canSend = (value.trim().length > 0 || hasAttachment) && !isSending;

  // The screen's SafeAreaView already pads for the home indicator, which the
  // keyboard covers too — so only lift by the part of the keyboard above it.
  const keyboardOffset = useAnimatedStyle(() => ({
    marginBottom: Math.max(keyboard.height.value - insets.bottom, 0),
  }));

  return (
    <Animated.View style={[styles.bar, keyboardOffset]}>
      {!!errorMessage && (
        <ThemedText type="small" style={styles.error} accessibilityLiveRegion="polite">
          {errorMessage}
        </ThemedText>
      )}
      {attachment}
      <View style={[styles.pill, !!leading && styles.pillWithLeading, isFocused && styles.pillFocused]}>
        {leading}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          multiline
          {...WEB_SINGLE_ROW}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          // Grows with its content up to a few lines (web textareas don't on
          // their own), then scrolls.
          onContentSizeChange={(event) =>
            setInputHeight(
              Math.min(Math.max(event.nativeEvent.contentSize.height, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT),
            )
          }
          // Browsers never report a shrinking content height, so an emptied
          // input (e.g. after sending) snaps back to one line explicitly.
          style={[styles.input, WEB_NO_OUTLINE, { height: value ? inputHeight : MIN_INPUT_HEIGHT }]}
          accessibilityLabel={inputLabel}
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={sendLabel}
          aria-busy={isSending}
          style={({ pressed }) => [
            styles.send,
            canSend ? styles.sendActive : styles.sendIdle,
            pressed && styles.sendPressed,
          ]}>
          {isSending ? (
            <ActivityIndicator size="small" color={Colors.onPrimary} />
          ) : (
            <SymbolView
              name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
              size={20}
              weight="bold"
              tintColor={canSend ? Colors.onPrimary : Colors.textSecondary}
            />
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
    backgroundColor: Colors.background,
  },
  error: { color: Colors.danger, paddingHorizontal: Spacing.three },
  pill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Roundness.sheet,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.backgroundElement,
  },
  pillWithLeading: { paddingLeft: Spacing.one },
  // Focus shows on the whole pill rather than the browser's own outline
  // around the bare text area.
  pillFocused: { borderColor: Colors.primary },
  input: {
    flex: 1,
    // Vertically centres a single line against the 40pt send button.
    paddingTop: 10,
    paddingBottom: 10,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 20,
  },
  send: {
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    borderRadius: SEND_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive: { backgroundColor: Colors.primary, ...Glow.primary },
  sendIdle: { backgroundColor: Colors.backgroundSelected },
  sendPressed: { opacity: 0.85, transform: [{ scale: 0.94 }] },
});
