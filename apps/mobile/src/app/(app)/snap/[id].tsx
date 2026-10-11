import { SNAP_PHOTO_SECONDS } from '@vybe/shared';
import { useEvent, useEventListener } from 'expo';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Avatar } from '@/components/avatar';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamily, Spacing } from '@/constants/theme';
import { useProfileById } from '@/features/discovery/use-profile-by-id';
import { useOpenSnap, useSnapMessage } from '@/features/snaps/use-snaps';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getErrorMessage } from '@/lib/get-error-message';

const paramsSchema = z.object({ id: z.uuid() });

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/messages');
}

function snapErrorText(error: unknown): string {
  const message = getErrorMessage(error);
  if (message.includes('snap_already_opened')) return 'This snap has already been opened.';
  if (message.includes('snap_expired')) return 'This snap expired before it was opened.';
  if (message.includes('snap_not_found')) return "This snap isn't available.";
  return message;
}

/**
 * Tap anywhere to close. A sibling layer over the snap rather than a
 * wrapper around it, so the play button can sit above it without being a
 * button inside a button (invalid on web).
 */
function CloseLayer({ label }: { label: string }) {
  return <Pressable onPress={close} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={label} />;
}

/** A thin bar across the top that runs down while the snap is on screen. */
function Countdown({ seconds }: { seconds: number }) {
  const progress = useSharedValue(1);
  useEffect(() => {
    progress.value = withTiming(0, { duration: seconds * 1000, easing: Easing.linear });
  }, [progress, seconds]);
  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.bar, style]} />
    </View>
  );
}

function SnapVideo({ url, closeLabel }: { url: string; closeLabel: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = false;
    instance.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const [hasStarted, setHasStarted] = useState(false);
  if (isPlaying && !hasStarted) setHasStarted(true);
  // A video snap plays once, then it's gone.
  useEventListener(player, 'playToEnd', close);

  // Browsers block a video with sound from starting on its own; a tap has
  // to start it. (Phones play it straight away.) The button sits above the
  // close layer, so that first tap plays instead of closing.
  const isBlocked = status === 'readyToPlay' && !isPlaying && !hasStarted;

  return (
    <>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      <CloseLayer label={closeLabel} />
      {isBlocked && (
        <Pressable
          onPress={() => player.play()}
          style={styles.playOverlay}
          accessibilityRole="button"
          accessibilityLabel="Play video snap">
          <View style={styles.playButton}>
            <SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={34} tintColor={Colors.text} />
          </View>
        </Pressable>
      )}
    </>
  );
}

function SnapPhoto({ url, closeLabel }: { url: string; closeLabel: string }) {
  useEffect(() => {
    const timer = setTimeout(close, SNAP_PHOTO_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="contain" />
      <CloseLayer label={closeLabel} />
    </>
  );
}

export default function SnapViewerScreen() {
  const params = paramsSchema.safeParse(useLocalSearchParams());
  const snapId = params.success ? params.data.id : undefined;
  const snap = useSnapMessage(snapId);
  const { mutate: openSnap, error: openError } = useOpenSnap();
  const sender = useProfileById(snap.data?.sender_id);
  const [url, setUrl] = useState<string | null>(null);

  // Opening is what lets the recipient read the file at all, so it happens
  // only once the snap is actually on screen.
  const snapData = snap.data;
  useEffect(() => {
    if (snapData) openSnap(snapData, { onSuccess: setUrl });
  }, [snapData, openSnap]);

  const name = sender.data?.display_name ?? sender.data?.username ?? '';
  const failure = openError ?? snap.error ?? (snap.isSuccess && !snap.data ? new Error('snap_not_found') : null);

  if (failure) {
    return (
      <SafeAreaView style={[styles.screen, styles.message]}>
        <ThemedText type="subtitle" style={styles.centered}>
          {snapErrorText(failure)}
        </ThemedText>
        <ThemedButton title="Close" variant="secondary" onPress={close} />
      </SafeAreaView>
    );
  }

  const closeLabel = `Snap from ${name}. Tap to close`;
  return (
    <View style={styles.screen}>
      {url && snapData?.media_type === 'video' && <SnapVideo url={url} closeLabel={closeLabel} />}
      {url && snapData?.media_type === 'image' && <SnapPhoto url={url} closeLabel={closeLabel} />}
      {!url && (
        <>
          <ActivityIndicator style={StyleSheet.absoluteFill} color={Colors.text} />
          <CloseLayer label={closeLabel} />
        </>
      )}

      <SafeAreaView style={styles.chrome}>
        {url && snapData?.media_type === 'image' ? <Countdown seconds={SNAP_PHOTO_SECONDS} /> : <View style={styles.track} />}
        <View style={styles.sender}>
          <Avatar name={name || '?'} uri={sender.data?.avatar_url} size={36} />
          <View>
            <Text style={styles.senderName}>{name}</Text>
            {snapData && <Text style={styles.senderMeta}>{formatRelativeTime(snapData.created_at)}</Text>}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  message: { justifyContent: 'center', gap: Spacing.three, padding: Spacing.four, backgroundColor: Colors.background },
  centered: { textAlign: 'center' },
  // Taps go through to the close layer underneath.
  chrome: { position: 'absolute', top: 0, left: 0, right: 0, padding: Spacing.three, gap: Spacing.three, pointerEvents: 'none' },
  track: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.25)', overflow: 'hidden' },
  bar: { height: 3, backgroundColor: Colors.text },
  playOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sender: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  senderName: { color: Colors.text, fontFamily: FontFamily.bold, fontSize: 15 },
  senderMeta: { color: 'rgba(255, 255, 255, 0.7)', fontFamily: FontFamily.regular, fontSize: 12 },
});
