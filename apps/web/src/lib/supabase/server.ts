import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@vybe/shared";

/**
 * Server-side client for Server Components, Server Actions and Route
 * Handlers. Still bound by the signed-in user's RLS — this is not the
 * admin client. Create a fresh instance per request; never module-cache it.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component, where cookies can't be
            // written — safe to ignore because middleware refreshes the
            // session on every request anyway.
          }
        },
      },
    },
  );
}
