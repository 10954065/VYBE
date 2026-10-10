import "server-only";

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const USERS_LIMIT = 50;

export interface AdminUser {
  id: string;
  username: string;
  displayName: string | null;
  createdAt: string;
  suspendedAt: string | null;
  suspendedReason: string | null;
}

// Usernames are constrained to [a-z0-9_.] by profiles' own check
// constraint, so anything else in the search box can't match anyway --
// dropping it keeps stray % or , out of the ilike filter.
export function normalizeUsernameQuery(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 30);
}

// Empty query lists everyone currently suspended, so a suspension can always
// be found and reversed even after the report that prompted it is closed.
export async function searchUsers(query: string): Promise<AdminUser[]> {
  await requireAdmin();

  let request = createAdminClient()
    .from("profiles")
    .select("id, username, display_name, created_at, suspended_at, suspended_reason")
    .limit(USERS_LIMIT);

  request = query
    ? request.ilike("username", `%${query}%`).order("username")
    : request.not("suspended_at", "is", null).order("suspended_at", { ascending: false });

  const { data, error } = await request;
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    createdAt: row.created_at,
    suspendedAt: row.suspended_at,
    suspendedReason: row.suspended_reason,
  }));
}
