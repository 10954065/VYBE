import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AdminStatus =
  | { status: "signed_out" }
  | { status: "forbidden"; email: string | null }
  | { status: "admin"; userId: string; email: string };

// There is no admin role in the database (checked: no is_admin/role column
// on profiles, no moderators table) -- admins are identified by an email
// allowlist that only ever lives server-side. Never NEXT_PUBLIC_.
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().has(email.toLowerCase());
}

// getUser() revalidates the session against Supabase Auth, unlike
// getSession(), which trusts whatever is in the cookie. cache() dedupes it
// within one request -- the layout gate, account menu, and data layer all
// ask -- without sharing anything across requests. connection() keeps it out
// of runtime prefetch renders: it's a network round-trip to Supabase Auth
// that reads the clock (token expiry), so it only makes sense per request.
export const getAdminStatus = cache(async (): Promise<AdminStatus> => {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "signed_out" };
  if (!user.email || !isAdminEmail(user.email)) return { status: "forbidden", email: user.email ?? null };
  return { status: "admin", userId: user.id, email: user.email };
});

// Called by every privileged read and every Server Action, rather than
// trusting that the layout already checked: in the App Router a page
// renders in parallel with its layout (confirmed live -- the reports page
// ran even while the layout was showing "Not authorized"), and layouts
// aren't re-run on client navigation.
export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const result = await getAdminStatus();
  if (result.status === "signed_out") redirect("/admin/login");
  if (result.status === "forbidden") redirect("/admin/not-authorized");
  return { userId: result.userId, email: result.email };
}
