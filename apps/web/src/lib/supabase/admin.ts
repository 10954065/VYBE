import "server-only";
import { createSupabaseClient } from "@vybe/shared";

/**
 * Service-role client: bypasses RLS entirely. For trusted server-side
 * operations only — awarding XP, resolving reports, admin endpoints. The
 * `server-only` import makes bundling this into a Client Component a
 * build error, not just a code-review mistake.
 */
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.SUPABASE_SECRET_KEY ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
