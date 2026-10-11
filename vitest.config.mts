import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests for logic that doesn't need a device or a database. Database
// rules (RLS, triggers, RPCs) are tested separately with pgTAP:
// `npx supabase test db` (supabase/tests/database).
export default defineConfig({
  test: {
    projects: [
      {
        test: { name: "shared", include: ["packages/shared/src/**/*.test.ts"], environment: "node" },
      },
      {
        // Only plain-TypeScript modules: anything importing react-native
        // needs a device or jest-expo, not Node.
        resolve: { alias: { "@": path.resolve(import.meta.dirname, "apps/mobile/src") } },
        test: { name: "mobile", include: ["apps/mobile/src/**/*.test.ts"], environment: "node" },
      },
      {
        resolve: {
          alias: {
            "@": path.resolve(import.meta.dirname, "apps/web/src"),
            // `server-only` throws when imported outside a React Server
            // Component; tests import server modules for their pure helpers.
            "server-only": path.resolve(import.meta.dirname, "apps/web/test/server-only-stub.ts"),
          },
        },
        test: { name: "web", include: ["apps/web/src/**/*.test.ts"], environment: "node" },
      },
    ],
  },
});
