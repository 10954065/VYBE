import { redirect } from "next/navigation";

// apps/web serves the API (account deletion) and the admin dashboard; there
// is no public site here yet, so the root goes straight to the dashboard.
export default function Home() {
  redirect("/admin");
}
