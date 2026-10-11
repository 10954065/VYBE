import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily } from '@/constants/theme';

interface AvatarProps {
  name: string;
  uri: string | null | undefined;
  size: number;
}

/** A round profile photo, or the name's first letter when there isn't one. */
export function Avatar({ name, uri, size }: AvatarProps) {
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={shape} contentFit="cover" accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={[styles.fallback, shape]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{name.trim()[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  initial: { color: Colors.text, fontFamily: FontFamily.bold },
});
