/**
 * XP, levels, streaks and badges are configuration, not logic baked into
 * UI components. Every XP award must be recorded as an xp_transactions row
 * server-side — never a direct mutation of a user's XP total.
 */
export const XP_AWARDS = {
  check_in: 10,
  attend_event: 25,
  create_post: 5,
  join_challenge: 5,
  complete_challenge: 50,
  join_crew: 15,
  explore_new_place: 20,
  meaningful_engagement_received: 2,
} as const;

export type XpAwardReason = keyof typeof XP_AWARDS;

/** Level thresholds: cumulative XP required to reach each level. Index 0 = level 1. */
export const LEVEL_THRESHOLDS: readonly number[] = [
  0, 100, 250, 500, 900, 1400, 2000, 2750, 3600, 4600, 5800,
];

export function levelForXp(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]!) {
      level = i + 1;
    }
  }
  return level;
}

export const STREAK_TYPES = ["outside", "social", "explorer", "event"] as const;

export type StreakType = (typeof STREAK_TYPES)[number];

/** Minimum gap enforced between check-ins to prevent spam/abuse. */
export const CHECK_IN_RATE_LIMIT_SECONDS = 120;

export const BADGE_SLUGS = [
  "first_check_in",
  "explorer",
  "social_starter",
  "weekend_warrior",
  "crew_builder",
  "event_regular",
  "early_vyber",
] as const;

export type BadgeSlug = (typeof BADGE_SLUGS)[number];
