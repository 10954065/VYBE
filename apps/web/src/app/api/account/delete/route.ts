import { createSupabaseClient } from "@vybe/shared";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Deletes the caller's own account. Mobile sends its Supabase access token
 * in Authorization: Bearer <token> (there's no shared cookie jar between
 * the app and this API), which we verify against the anon-scoped client
 * before touching anything with the admin client. Deleting auth.users
 * cascades through every table that references profiles — see
 * docs/database-schema.md for how that cascade graph was verified.
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const anon = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  );
  const { data: userData, error: userError } = await anon.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    return new Response(deleteError.message, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
