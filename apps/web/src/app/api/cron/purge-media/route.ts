import { isCronAuthorized, purgeMedia } from "@/lib/storage/purge-media";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Scheduled cleanup of snap files and abandoned uploads (see
 * lib/storage/purge-media.ts). Vercel Cron calls it with GET and
 * `Authorization: Bearer $CRON_SECRET`; anything else is refused. Without
 * CRON_SECRET configured it refuses everything rather than running open.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET is not configured", { status: 503 });
  }
  if (!isCronAuthorized(request.headers.get("authorization"), secret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await purgeMedia(createAdminClient());
    return Response.json(result);
  } catch (error) {
    console.error("purge-media failed", error);
    return new Response("Cleanup failed", { status: 500 });
  }
}
