import { describe, expect, it } from "vitest";

import { getLevelProgress, LEVEL_THRESHOLDS, levelForXp } from "./gamification";

describe("levelForXp", () => {
  // Pairs taken from the database's own level_for_xp(bigint): the app and
  // the server must agree on every level boundary, or the profile's level
  // and the level-up notification disagree.
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [299, 2],
    [300, 3],
    [599, 3],
    [600, 4],
    [494_999, 99],
    [495_000, 100],
    [10_000_000, 100],
  ])("%i XP is level %i, same as the database", (xp, level) => {
    expect(levelForXp(xp)).toBe(level);
  });

  it("uses thresholds of 50 × n × (n + 1)", () => {
    expect(LEVEL_THRESHOLDS.slice(0, 5)).toEqual([0, 100, 300, 600, 1000]);
  });
});

describe("getLevelProgress", () => {
  it("reports progress within the current level", () => {
    expect(getLevelProgress(226)).toEqual({
      level: 2,
      xpIntoLevel: 126,
      xpForLevel: 200,
      xpToNextLevel: 74,
      progressRatio: 0.63,
    });
  });

  it("is complete at the top level, with nothing left to earn", () => {
    const progress = getLevelProgress(10_000_000);
    expect(progress.level).toBe(100);
    expect(progress.progressRatio).toBe(1);
    expect(progress.xpToNextLevel).toBe(0);
  });
});
