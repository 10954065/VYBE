import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Roundness, Spacing } from '@/constants/theme';

interface SearchResultRowProps {
  imageUrl: string | null;
  fallbackLabel: string;
  title: string;
  subtitle?: string | null;
  onPress: () => void;
}

export function SearchResultRow({ imageUrl, fallbackLabel, title, subtitle, onPress }: SearchResultRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button" accessibilityLabel={title}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <ThemedText type="smallBold">{fallbackLabel[0]?.toUpperCase()}</ThemedText>
        </View>
      )}
      <View style={styles.body}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {!!subtitle && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Roundness.card,
    padding: Spacing.two,
  },
  avatar: { width: 44, height: 44, borderRadius: Roundness.pill },
  avatarFallback: { backgroundColor: Colors.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
});
