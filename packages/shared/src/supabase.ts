import { createClient, type SupabaseClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Creates a typed Supabase client from caller-supplied credentials. Callers
 * decide which key to pass — the publishable key on mobile/browser, the
 * secret key only inside server-side code in apps/web. This module never
 * reads environment variables itself, so it stays usable from both
 * runtimes without accidentally bundling a secret into client code.
 */
export function createSupabaseClient(
  url: string,
  key: string,
  options?: SupabaseClientOptions<"public">,
): TypedSupabaseClient {
  if (!url || !key) {
    throw new Error("Supabase URL and key are required to create a client.");
  }
  return createClient<Database>(url, key, options);
}
