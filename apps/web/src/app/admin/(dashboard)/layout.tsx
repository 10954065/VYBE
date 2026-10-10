import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { getAdminStatus, requireAdmin } from "@/lib/auth/admin";
import { SignOutButton } from "../sign-out-button";

const NAV_LINKS = [
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
] as const;

async function AccountMenu() {
  const admin = await getAdminStatus();
  if (admin.status !== "admin") return null;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-neutral-500">{admin.email}</span>
      <SignOutButton />
    </div>
  );
}

// Session reads happen at request time, so with cacheComponents enabled
// they live behind a Suspense boundary rather than at the layout's top
// level -- the static chrome above still prerenders. Non-admins are
// redirected (to login, or to /admin/not-authorized if signed in).
async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-lg font-bold tracking-tight">
              VYBE <span className="text-fuchsia-400">admin</span>
            </Link>
            <nav aria-label="Admin sections" className="flex gap-5 text-sm">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-neutral-300 hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <Suspense fallback={null}>
            <AccountMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Suspense fallback={<p className="text-neutral-500">Loading…</p>}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}
