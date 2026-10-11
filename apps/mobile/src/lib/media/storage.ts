import 'react-native-get-random-values';

import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

/** How long a signed media URL stays valid. The app re-signs before it lapses. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;
const RESIGN_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

/** A random, unguessable file name. Storage paths are `<user id>/<this>`. */
export function randomFileName(extension: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex}.${extension}`;
}

/**
 * Uploads a local file (a `file://` URI on a phone, a `blob:` URI on web)
 * to a private bucket. Never overwrites: every upload gets a new path.
 */
export async function uploadFile(bucket: string, path: string, uri: string, contentType: string): Promise<void> {
  const response = await fetch(uri);
  const body = await response.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: false });
  if (error) throw error;
}

/** Best-effort removal of uploads that ended up unused (e.g. the post failed). */
export async function removeFiles(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

/**
 * Short-lived URLs for private media, keyed by path. Storage signs only the
 * paths its RLS lets this user read, so a post's audience rules apply to
 * its photos too. Re-signed shortly before the URLs expire.
 */
export function useSignedUrls(bucket: string, paths: string[]) {
  return useQuery({
    queryKey: ['signed-urls', bucket, ...paths],
    enabled: paths.length > 0,
    staleTime: SIGNED_URL_TTL_SECONDS * 1000 - RESIGN_BEFORE_EXPIRY_MS,
    refetchInterval: SIGNED_URL_TTL_SECONDS * 1000 - RESIGN_BEFORE_EXPIRY_MS,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      const urls: Record<string, string> = {};
      for (const item of data) {
        if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
      }
      return urls;
    },
  });
}
