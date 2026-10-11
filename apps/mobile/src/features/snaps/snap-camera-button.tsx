import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

/** The camera button on Home: take a snap and send it to friends. */
export function SnapCameraButton() {
  return (
    <Pressable
      onPress={() => router.push('/snap/camera')}
      hitSlop={8}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Send a snap">
      <SymbolView name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }} size={22} tintColor={Colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
