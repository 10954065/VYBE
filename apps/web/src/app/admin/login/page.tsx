import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getAdminStatus } from "@/lib/auth/admin";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// An already-signed-in admin skips the form. Reads the session, so it sits
// behind the Suspense boundary below rather than at the page's top level.
async function LoginGate() {
  const admin = await getAdminStatus();
  if (admin.status === "admin") {
    redirect("/admin/reports");
  }
  return <LoginForm />;
}

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            VYBE <span className="text-fuchsia-400">admin</span>
          </h1>
          <p className="text-sm text-neutral-400">Sign in with an admin account.</p>
        </div>
        <Suspense fallback={null}>
          <LoginGate />
        </Suspense>
      </div>
    </main>
  );
}
