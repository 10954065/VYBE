import { describe, expect, it } from "vitest";

import { ANALYTICS_EVENT_NAME_PATTERN, ANALYTICS_EVENT_NAMES, analyticsEventSchemas } from "./analytics";

describe("analytics event catalog", () => {
  it("only has names the database accepts (analytics_events_event_name_format)", () => {
    for (const name of ANALYTICS_EVENT_NAMES) {
      expect(name).toMatch(ANALYTICS_EVENT_NAME_PATTERN);
    }
  });

  it("accepts an event's documented properties", () => {
    expect(analyticsEventSchemas.post_created.safeParse({ visibility: "followers", in_crew: false }).success).toBe(true);
    expect(analyticsEventSchemas.app_opened.safeParse({}).success).toBe(true);
  });

  // The catalog is the privacy boundary: the same payload goes to our table
  // and to PostHog, so nothing beyond the declared, non-personal fields may
  // ride along.
  it.each([
    ["post_created", { visibility: "everyone", in_crew: false, body: "my post text" }],
    ["search_performed", { query_length: 6, result_count: 2, query: "labadi" }],
    ["app_opened", { email: "someone@example.com" }],
  ] as const)("rejects undeclared properties on %s", (name, properties) => {
    expect(analyticsEventSchemas[name].safeParse(properties).success).toBe(false);
  });

  it("rejects values outside an event's declared set", () => {
    expect(analyticsEventSchemas.event_rsvp.safeParse({ status: "checked_in" }).success).toBe(false);
  });
});
