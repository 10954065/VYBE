import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamily } from '@/constants/theme';

const DURATION = 700;

// Matches the native splash (app.json expo-splash-screen: same mark, same
// obsidian background), so hiding the native splash is seamless; then the
// wordmark is visible for a beat before the overlay fades into the app.
export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    45: {
      opacity: 1,
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1.08 }],
      easing: Easing.out(Easing.quad),
    },
  });

  const brand = (
    <>
      <Image style={styles.mark} source={require('@/assets/images/brand-mark.png')} />
      <ThemedText style={styles.wordmark}>VYBE</ThemedText>
    </>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {brand}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {brand}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 120,
    height: 120,
  },
  wordmark: {
    marginTop: 12,
    fontFamily: FontFamily.extrabold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: 8,
    color: Colors.text,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
