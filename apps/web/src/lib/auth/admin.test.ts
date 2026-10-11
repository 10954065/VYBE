import { afterEach, describe, expect, it, vi } from "vitest";

import { isAdminEmail } from "./admin";

describe("isAdminEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lets nobody in when ADMIN_EMAILS is empty", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdminEmail("admin@vybe.app")).toBe(false);
  });

  it("matches listed addresses regardless of case and spacing", () => {
    vi.stubEnv("ADMIN_EMAILS", " Admin@Vybe.app , ops@vybe.app ");
    expect(isAdminEmail("admin@vybe.app")).toBe(true);
    expect(isAdminEmail("OPS@VYBE.APP")).toBe(true);
  });

  it("does not match unlisted, partial, or missing addresses", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@vybe.app");
    expect(isAdminEmail("someone@vybe.app")).toBe(false);
    expect(isAdminEmail("admin@vybe.app.evil.com")).toBe(false);
    expect(isAdminEmail("")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("ignores empty entries from stray commas", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@vybe.app,,");
    expect(isAdminEmail("")).toBe(false);
  });
});
