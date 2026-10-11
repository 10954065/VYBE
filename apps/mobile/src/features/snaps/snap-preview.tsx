import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, FontFamily, Glow, Roundness, Spacing } from '@/constants/theme';

import type { CapturedSnap } from './snap-media';

function LoopingVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.play();
  });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

interface SnapPreviewProps {
  snap: CapturedSnap;
  /** "Send to Ama", or "Send to…" when the recipients are chosen next. */
  sendLabel: string;
  isSending: boolean;
  errorMessage?: string;
  onRetake: () => void;
  onSend: () => void;
}

/** The snap just taken, full screen, with retake and send. */
export function SnapPreview({ snap, sendLabel, isSending, errorMessage, onRetake, onSend }: SnapPreviewProps) {
  return (
    <View style={styles.screen}>
      {snap.type === 'video' ? (
        <LoopingVideo uri={snap.uri} />
      ) : (
        <Image source={{ uri: snap.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      <SafeAreaView style={styles.overlay}>
        <Pressable
          onPress={onRetake}
          disabled={isSending}
          hitSlop={8}
          style={styles.retake}
          accessibilityRole="button"
          accessibilityLabel="Discard and retake">
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={22} tintColor={Colors.text} />
        </Pressable>

        <View style={styles.bottom}>
          {!!errorMessage && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {errorMessage}
            </Text>
          )}
          <Pressable
            onPress={onSend}
            disabled={isSending}
            style={({ pressed }) => [styles.send, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={sendLabel}
            aria-busy={isSending}>
            {isSending ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.sendLabel} numberOfLines={1}>
                  {sendLabel}
                </Text>
                <SymbolView
                  name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
                  size={18}
                  tintColor={Colors.onPrimary}
                />
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between', padding: Spacing.three },
  retake: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  bottom: { alignItems: 'flex-end', gap: Spacing.two },
  error: {
    color: Colors.text,
    backgroundColor: Colors.dangerContainer,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  send: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 140,
    maxWidth: '80%',
    height: 52,
    paddingHorizontal: Spacing.four,
    borderRadius: Roundness.pill,
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    ...Glow.primary,
  },
  sendLabel: { color: Colors.onPrimary, fontFamily: FontFamily.bold, fontSize: 16, flexShrink: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
