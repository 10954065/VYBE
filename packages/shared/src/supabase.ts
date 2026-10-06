import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client from caller-supplied credentials. Callers
 * decide which key to pass — the anon key on mobile/browser, the
 * service-role key only inside server-side code in apps/web. This module
 * never reads environment variables itself, so it stays usable from both
 * runtimes without accidentally bundling a secret into client code.
 */
export function createSupabaseClient(url: string, key: string): SupabaseClient {
  if (!url || !key) {
    throw new Error("Supabase URL and key are required to create a client.");
  }
  return createClient(url, key);
}
