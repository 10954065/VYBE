import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

/**
 * Creates a handful of demo accounts via the Auth Admin API, for local
 * development only. Deliberately not done as raw SQL against auth.users in
 * supabase/seed.sql — that table's shape is Supabase-version-sensitive and
 * fragile to hand-craft; the Admin API is the stable, supported path.
 */
const DEV_USERS = [
  { email: "kwame@vybe.dev", displayName: "Kwame Asante" },
  { email: "ama@vybe.dev", displayName: "Ama Boateng" },
  { email: "kofi@vybe.dev", displayName: "Kofi Mensah" },
  { email: "akosua@vybe.dev", displayName: "Akosua Owusu" },
  { email: "yaw@vybe.dev", displayName: "Yaw Darko" },
] as const;

const DEV_PASSWORD = "vybe-dev-password-123";

async function main() {
  if (process.env.APP_ENV === "production") {
    throw new Error("Refusing to seed dev users against a production environment.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.");
  }

  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const user of DEV_USERS) {
    const { error } = await admin.auth.admin.createUser({
      email: user.email,
      password: DEV_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: user.displayName },
    });

    if (error && !error.message.toLowerCase().includes("already been registered")) {
      throw error;
    }

    console.log(error ? `skip (exists): ${user.email}` : `created: ${user.email}`);
  }

  console.log(`\nDone. Dev password for all seeded accounts: ${DEV_PASSWORD}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
