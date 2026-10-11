import { SNAP_MAX_VIDEO_MS, type SnapMediaType } from '@vybe/shared';
import * as ImagePicker from 'expo-image-picker';

/** A snap that's been taken (or picked) but not sent yet. */
export interface CapturedSnap {
  uri: string;
  type: SnapMediaType;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  /** For videos: the file's MIME type, which decides its extension. */
  mimeType: string | null;
}

/** Full-screen on a phone: snaps are taller than feed photos. */
export const SNAP_PHOTO_MAX_EDGE = 1920;
// Mirrors the snaps bucket's file_size_limit (25 MB).
const SNAP_MAX_BYTES = 25 * 1024 * 1024;
// The camera stops at 10 s; picked videos get a little slack, as the
// database does (media_duration_ms <= 10500).
const SNAP_VIDEO_SLACK_MS = 500;

export class SnapTooLongError extends Error {
  constructor() {
    super(`Snaps can be up to ${SNAP_MAX_VIDEO_MS / 1000} seconds. Trim the video and try again.`);
  }
}

export class SnapTooLargeError extends Error {
  constructor() {
    super('That video is too large to send as a snap.');
  }
}

/** Extension and Content-Type for a snap's file. */
export function snapFileFormat(snap: Pick<CapturedSnap, 'type' | 'mimeType' | 'uri'>): {
  extension: 'jpg' | 'mp4' | 'mov';
  contentType: string;
} {
  if (snap.type === 'image') return { extension: 'jpg', contentType: 'image/jpeg' };
  const isQuickTime = snap.mimeType === 'video/quicktime' || /\.mov($|\?)/i.test(snap.uri);
  return isQuickTime
    ? { extension: 'mov', contentType: 'video/quicktime' }
    : { extension: 'mp4', contentType: 'video/mp4' };
}

/**
 * A photo or a video of up to 10 seconds from the library. Null when
 * cancelled; throws when the video is too long or too large to send.
 */
export async function pickSnapFromLibrary(): Promise<CapturedSnap | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 1 });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const isVideo = asset.type === 'video';
  if (isVideo && (asset.duration ?? 0) > SNAP_MAX_VIDEO_MS + SNAP_VIDEO_SLACK_MS) throw new SnapTooLongError();
  if (isVideo && (asset.fileSize ?? 0) > SNAP_MAX_BYTES) throw new SnapTooLargeError();

  return {
    uri: asset.uri,
    type: isVideo ? 'video' : 'image',
    width: asset.width || null,
    height: asset.height || null,
    durationMs: isVideo && asset.duration ? Math.round(asset.duration) : null,
    mimeType: asset.mimeType ?? null,
  };
}
