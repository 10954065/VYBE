import { POST_MEDIA_BUCKET, type PostMedia } from '@vybe/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PhotoViewer } from '@/components/photo-viewer';
import { Colors, Spacing } from '@/constants/theme';
import { useSignedUrls } from '@/lib/media/storage';

// A single photo keeps its own shape, within limits: very tall or very wide
// photos would otherwise dominate the feed or shrink to a sliver.
const SINGLE_MIN_RATIO = 4 / 5;
const SINGLE_MAX_RATIO = 16 / 9;
const GAP = 2;

function singleRatio(photo: PostMedia): number {
  if (!photo.width || !photo.height) return 1;
  return Math.min(Math.max(photo.width / photo.height, SINGLE_MIN_RATIO), SINGLE_MAX_RATIO);
}

interface PostPhotosProps {
  media: PostMedia[];
}

/** A post's photos as a 1-4 tile grid; tapping one opens the full-screen viewer. */
export function PostPhotos({ media }: PostPhotosProps) {
  const photos = media.filter((item) => item.type === 'image');
  const paths = photos.map((photo) => photo.path);
  const { data: urls } = useSignedUrls(POST_MEDIA_BUCKET, paths);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const tile = (index: number, style?: object) => (
    <Pressable
      key={photos[index].path}
      onPress={() => setOpenIndex(index)}
      style={[styles.tile, style]}
      // 'button', not 'imagebutton': React Native Web drops the latter.
      accessibilityRole="button"
      accessibilityLabel={photos.length > 1 ? `Open photo ${index + 1} of ${photos.length}` : 'Open photo'}>
      <Image
        source={urls?.[photos[index].path] ? { uri: urls[photos[index].path], cacheKey: photos[index].path } : undefined}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={150}
      />
    </Pressable>
  );

  let grid: React.ReactNode;
  if (photos.length === 1) {
    grid = <View style={{ aspectRatio: singleRatio(photos[0]) }}>{tile(0, styles.fill)}</View>;
  } else if (photos.length === 2) {
    grid = (
      <View style={[styles.row, { aspectRatio: 2 }]}>
        {tile(0)}
        {tile(1)}
      </View>
    );
  } else if (photos.length === 3) {
    grid = (
      <View style={[styles.row, { aspectRatio: 3 / 2 }]}>
        {tile(0, { flex: 2 })}
        <View style={styles.column}>
          {tile(1)}
          {tile(2)}
        </View>
      </View>
    );
  } else {
    grid = (
      <View style={[styles.column, { aspectRatio: 1 }]}>
        <View style={styles.row}>
          {tile(0)}
          {tile(1)}
        </View>
        <View style={styles.row}>
          {tile(2)}
          {tile(3)}
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.frame}>{grid}</View>
      {openIndex !== null && (
        <PhotoViewer
          photos={photos.map((photo) => ({ key: photo.path, url: urls?.[photo.path] }))}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: Spacing.three, overflow: 'hidden' },
  row: { flex: 1, flexDirection: 'row', gap: GAP },
  column: { flex: 1, gap: GAP },
  tile: { flex: 1, backgroundColor: Colors.backgroundSelected, overflow: 'hidden' },
  fill: { flex: 1 },
});
