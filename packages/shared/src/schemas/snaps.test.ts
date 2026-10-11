import { describe, expect, it } from "vitest";

import { accraToday, liveStreak } from "./snaps";

describe("accraToday", () => {
  it("is the UTC date, since Accra is UTC+0 all year", () => {
    expect(accraToday(new Date("2026-10-11T23:59:59Z"))).toBe("2026-10-11");
    expect(accraToday(new Date("2026-10-12T00:00:00Z"))).toBe("2026-10-12");
  });
});

describe("liveStreak", () => {
  const today = "2026-10-11";

  it("shows a streak kept up today", () => {
    expect(liveStreak({ streak_day: "2026-10-11", streak_count: 5 }, today)).toEqual({ count: 5, endsTonight: false });
  });

  it("keeps yesterday's streak alive, ending tonight", () => {
    expect(liveStreak({ streak_day: "2026-10-10", streak_count: 5 }, today)).toEqual({ count: 5, endsTonight: true });
  });

  it("counts across a month boundary", () => {
    expect(liveStreak({ streak_day: "2026-09-30", streak_count: 3 }, "2026-10-01")).toEqual({
      count: 3,
      endsTonight: true,
    });
  });

  it("drops a streak once a whole day was missed", () => {
    expect(liveStreak({ streak_day: "2026-10-09", streak_count: 30 }, today)).toEqual({ count: 0, endsTonight: false });
  });

  it("shows nothing before the first streak", () => {
    expect(liveStreak({ streak_day: null, streak_count: 0 }, today)).toEqual({ count: 0, endsTonight: false });
  });
});
