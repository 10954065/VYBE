import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { showAlert } from '@/lib/confirm';

/** Long edge of an uploaded photo: sharp on a phone, a fraction of the original's size. */
export const PHOTO_MAX_EDGE = 1600;
const PHOTO_JPEG_QUALITY = 0.8;

export interface LocalPhoto {
  uri: string;
  width: number;
  height: number;
}

/**
 * Shrinks a photo to at most PHOTO_MAX_EDGE on its long side and re-encodes
 * it as JPEG. Re-encoding also drops the original's metadata, including the
 * GPS location phones write into every photo.
 */
export async function preparePhoto(photo: LocalPhoto): Promise<LocalPhoto> {
  const context = ImageManipulator.manipulate(photo.uri);
  const longEdge = Math.max(photo.width, photo.height);
  if (longEdge > PHOTO_MAX_EDGE) {
    context.resize(photo.width >= photo.height ? { width: PHOTO_MAX_EDGE } : { height: PHOTO_MAX_EDGE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_JPEG_QUALITY });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/** Lets the user pick up to `limit` photos from their library. Empty when cancelled. */
export async function pickPhotos(limit: number): Promise<LocalPhoto[]> {
  if (limit <= 0) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 1,
  });
  if (result.canceled) return [];
  return result.assets.slice(0, limit).map(({ uri, width, height }) => ({ uri, width, height }));
}

/** Opens the camera for one photo. Null when cancelled or camera access is refused. */
export async function takePhoto(): Promise<LocalPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    showAlert('Camera access needed', 'Allow VYBE to use the camera in Settings to take a photo.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled) return null;
  const { uri, width, height } = result.assets[0];
  return { uri, width, height };
}
