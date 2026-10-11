import "server-only";
import { timingSafeEqual } from "node:crypto";
import { SNAPS_BUCKET } from "@vybe/shared";

import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

// Storage deletes take a list of paths; keep each request modest.
const REMOVE_BATCH = 100;

export interface PurgeResult {
  snapsPurged: number;
  orphansRemoved: number;
}

/**
 * Whether a request carries the cron secret, as `Authorization: Bearer
 * <secret>` (what Vercel Cron sends when CRON_SECRET is set). Constant
 * time, so the secret can't be guessed a character at a time.
 */
export function isCronAuthorized(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(authorization);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function removeInBatches(admin: AdminClient, bucket: string, paths: string[]): Promise<void> {
  for (let start = 0; start < paths.length; start += REMOVE_BATCH) {
    const { error } = await admin.storage.from(bucket).remove(paths.slice(start, start + REMOVE_BATCH));
    if (error) throw error;
  }
}

/**
 * Deletes media nobody can read any more. RLS already makes an opened
 * snap unreadable two minutes after opening; this removes the bytes too.
 *
 * - Snap files every recipient opened over 10 minutes ago, or that sat
 *   unopened for 30 days.
 * - Uploads never attached to a post or message after a day (a send that
 *   failed after uploading, or uploads made straight through the API).
 */
export async function purgeMedia(admin: AdminClient): Promise<PurgeResult> {
  const { data: snaps, error: snapsError } = await admin.rpc("get_purgeable_snaps", { p_limit: 500 });
  if (snapsError) throw snapsError;
  const snapPaths = (snaps ?? []).flatMap((row) => (row.media_path ? [row.media_path] : []));
  if (snapPaths.length > 0) {
    await removeInBatches(admin, SNAPS_BUCKET, snapPaths);
    const { error } = await admin.rpc("mark_snaps_purged", { p_paths: snapPaths });
    if (error) throw error;
  }

  const { data: orphans, error: orphansError } = await admin.rpc("get_orphaned_uploads", { p_limit: 500 });
  if (orphansError) throw orphansError;
  const byBucket = new Map<string, string[]>();
  for (const { bucket_id: bucket, name } of orphans ?? []) {
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), name]);
  }
  for (const [bucket, paths] of byBucket) {
    await removeInBatches(admin, bucket, paths);
  }

  return { snapsPurged: snapPaths.length, orphansRemoved: orphans?.length ?? 0 };
}
