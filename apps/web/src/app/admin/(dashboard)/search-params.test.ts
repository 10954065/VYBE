import { describe, expect, it } from "vitest";

import { parseRange } from "./analytics/queries";
import { parseStatusFilter } from "./reports/queries";
import { normalizeUsernameQuery } from "./users/queries";

// Every admin page reads its filters from the URL, which anyone can edit:
// each parser must turn arbitrary input into a value it was built for.

describe("parseStatusFilter", () => {
  it.each([
    ["pending", "pending"],
    ["resolved", "resolved"],
    ["all", "all"],
    [undefined, "pending"],
    ["PENDING", "pending"],
    ["pending' or '1'='1", "pending"],
  ])("%s -> %s", (input, expected) => {
    expect(parseStatusFilter(input)).toBe(expected);
  });
});

describe("parseRange", () => {
  it.each([
    ["7", 7],
    ["30", 30],
    ["90", 90],
    [undefined, 7],
    ["365", 7],
    ["-1", 7],
    ["7.5", 7],
    ["abc", 7],
  ])("days=%s -> %i", (input, expected) => {
    expect(parseRange(input)).toBe(expected);
  });
});

describe("normalizeUsernameQuery", () => {
  it("keeps only characters a username can contain", () => {
    // `%` and `,` would otherwise change the meaning of the ilike filter.
    expect(normalizeUsernameQuery("HENRY%,")).toBe("henry");
    expect(normalizeUsernameQuery("ama.k_1")).toBe("ama.k_1");
    expect(normalizeUsernameQuery("  kofi ")).toBe("kofi");
  });

  it("caps the length at the longest possible username", () => {
    expect(normalizeUsernameQuery("a".repeat(100))).toHaveLength(30);
  });

  it("returns an empty query for nothing usable", () => {
    expect(normalizeUsernameQuery(undefined)).toBe("");
    expect(normalizeUsernameQuery("%%%")).toBe("");
  });
});
