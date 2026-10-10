import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getAdminStatus } from "@/lib/auth/admin";
import { SignOutButton } from "../sign-out-button";

export const metadata: Metadata = { title: "Not authorized" };

// Signed in, but not on the admin allowlist. A separate page rather than a
// redirect back to login: signing in again as the same person wouldn't
// change anything.
async function NotAuthorizedMessage() {
  const admin = await getAdminStatus();
  if (admin.status === "signed_out") redirect("/admin/login");
  if (admin.status === "admin") redirect("/admin/reports");

  return (
    <>
      <p className="text-neutral-400">
        {admin.email ?? "This account"} isn&apos;t a VYBE admin. Sign in with an admin account to continue.
      </p>
      <SignOutButton />
    </>
  );
}

export default function NotAuthorizedPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <Suspense fallback={null}>
          <NotAuthorizedMessage />
        </Suspense>
      </div>
    </main>
  );
}
