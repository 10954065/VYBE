import { POST_MAX_PHOTOS } from '@vybe/shared';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Colors, Glow, Roundness, Spacing } from '@/constants/theme';
import { pickPhotos, takePhoto, type LocalPhoto } from '@/lib/media/photo';

const THUMB_SIZE = 72;
const TOOL_SIZE = 40;

export interface PostDraft {
  body: string;
  photos: LocalPhoto[];
}

interface PostComposerProps {
  placeholder: string;
  isPosting: boolean;
  errorMessage?: string;
  /** Call `onPosted` once the post is saved, to clear the composer. */
  onPost: (draft: PostDraft, onPosted: () => void) => void;
}

function ToolButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tool, disabled && styles.disabled, pressed && styles.pressed]}>
      <SymbolView name={icon} size={20} tintColor={Colors.primary} />
    </Pressable>
  );
}

/** Text plus up to four photos (library or camera), for the home and crew feeds. */
export function PostComposer({ placeholder, isPosting, errorMessage, onPost }: PostComposerProps) {
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const remaining = POST_MAX_PHOTOS - photos.length;
  const canPost = (body.trim().length > 0 || photos.length > 0) && !isPosting;

  const addFromLibrary = async () => {
    const picked = await pickPhotos(remaining);
    setPhotos((current) => [...current, ...picked].slice(0, POST_MAX_PHOTOS));
  };

  const addFromCamera = async () => {
    const photo = await takePhoto();
    if (photo) setPhotos((current) => [...current, photo].slice(0, POST_MAX_PHOTOS));
  };

  const removePhoto = (uri: string) => setPhotos((current) => current.filter((photo) => photo.uri !== uri));

  const submit = () => {
    if (!canPost) return;
    onPost({ body: body.trim(), photos }, () => {
      setBody('');
      setPhotos([]);
    });
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedTextInput
        placeholder={placeholder}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={2000}
        autoCapitalize="sentences"
      />

      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {photos.map((photo, index) => (
            <View key={photo.uri} style={styles.thumb}>
              <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <Pressable
                onPress={() => removePhoto(photo.uri)}
                disabled={isPosting}
                hitSlop={8}
                style={styles.remove}
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${index + 1}`}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={12}
                  weight="bold"
                  tintColor={Colors.text}
                />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {!!errorMessage && (
        <ThemedText type="small" style={styles.error} accessibilityLiveRegion="polite">
          {errorMessage}
        </ThemedText>
      )}

      <View style={styles.toolbar}>
        <ToolButton
          icon={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' }}
          label="Add photos from library"
          onPress={addFromLibrary}
          disabled={remaining === 0 || isPosting}
        />
        <ToolButton
          icon={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
          label="Take a photo"
          onPress={addFromCamera}
          disabled={remaining === 0 || isPosting}
        />
        {photos.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            {photos.length}/{POST_MAX_PHOTOS}
          </ThemedText>
        )}
        <View style={styles.spacer} />
        <Pressable
          onPress={submit}
          disabled={!canPost}
          accessibilityRole="button"
          accessibilityLabel="Post"
          aria-busy={isPosting}
          style={({ pressed }) => [
            styles.post,
            canPost ? styles.postActive : styles.postIdle,
            pressed && styles.pressed,
          ]}>
          {isPosting ? (
            <ActivityIndicator size="small" color={Colors.onPrimary} />
          ) : (
            <ThemedText type="smallBold" style={{ color: canPost ? Colors.onPrimary : Colors.textSecondary }}>
              Post
            </ThemedText>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  thumbs: { gap: Spacing.two },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundSelected,
  },
  remove: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  error: { color: Colors.danger },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tool: {
    width: TOOL_SIZE,
    height: TOOL_SIZE,
    borderRadius: TOOL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSelected,
  },
  spacer: { flex: 1 },
  post: {
    minWidth: 88,
    height: TOOL_SIZE,
    paddingHorizontal: Spacing.four,
    borderRadius: Roundness.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postActive: { backgroundColor: Colors.primary, ...Glow.primary },
  postIdle: { backgroundColor: Colors.backgroundSelected },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
