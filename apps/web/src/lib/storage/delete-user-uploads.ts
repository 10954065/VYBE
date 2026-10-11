import "server-only";
import { USER_UPLOAD_BUCKETS } from "@vybe/shared";

import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const PAGE_SIZE = 1000;

/**
 * Deletes every file a user uploaded. Each bucket in USER_UPLOAD_BUCKETS
 * keeps a user's files under `<user id>/`. Deleting the auth user cascades
 * through the tables that point at these files, but not the files
 * themselves (Storage has no foreign key to auth.users), so without this
 * a deleted account's photos would stay in the buckets for good.
 */
export async function deleteUserUploads(admin: AdminClient, userId: string): Promise<void> {
  for (const bucket of USER_UPLOAD_BUCKETS) {
    const storage = admin.storage.from(bucket);
    // Always list from the start: each pass removes what the last one found.
    for (;;) {
      const { data, error } = await storage.list(userId, { limit: PAGE_SIZE });
      if (error) throw error;
      if (data.length === 0) break;

      const { error: removeError } = await storage.remove(data.map((file) => `${userId}/${file.name}`));
      if (removeError) throw removeError;
      if (data.length < PAGE_SIZE) break;
    }
  }
}
