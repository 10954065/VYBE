import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export interface ViewerPhoto {
  /** Stable cache key (the storage path): signed URLs change on every re-sign. */
  key: string;
  url: string | undefined;
}

interface PhotoViewerProps {
  photos: ViewerPhoto[];
  initialIndex: number;
  onClose: () => void;
}

/** Full-screen, swipeable view of a post's photos. */
export function PhotoViewer({ photos, initialIndex, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait']}>
      <View style={styles.backdrop}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
          keyExtractor={(photo) => photo.key}
          onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
          renderItem={({ item, index: itemIndex }) => (
            <Image
              source={item.url ? { uri: item.url, cacheKey: item.key } : undefined}
              style={{ width, height }}
              contentFit="contain"
              accessibilityLabel={`Photo ${itemIndex + 1} of ${photos.length}`}
            />
          )}
        />
        <SafeAreaView style={styles.chrome}>
          <View style={styles.topBar}>
            {photos.length > 1 ? (
              <ThemedText type="smallBold" style={styles.counter}>
                {index + 1} / {photos.length}
              </ThemedText>
            ) : (
              <View />
            )}
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel="Close photo">
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={20}
                weight="bold"
                tintColor={Colors.text}
              />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const CLOSE_SIZE = 40;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  // Taps fall through to the photos except on the controls themselves.
  chrome: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'box-none' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    pointerEvents: 'box-none',
  },
  counter: { color: Colors.text },
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
