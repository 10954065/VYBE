import { createBrowserClient } from "@supabase/ssr";

/** Browser-side client for Client Components. Uses the public, RLS-bound key. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
