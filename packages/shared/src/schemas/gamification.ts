import { z } from "zod";

import { BADGE_SLUGS, STREAK_TYPES } from "../constants/gamification";

export const streakTypeSchema = z.enum(STREAK_TYPES);
export const badgeSlugSchema = z.enum(BADGE_SLUGS);

// Only 'outside' is actually computed by the engine today (see
// touch_outside_streak in 20261008000100_gamification_engine.sql) — the
// other three streak_types exist in the schema but have no trigger yet.
export const streakSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  streak_type: streakTypeSchema,
  current_count: z.number().int().nonnegative(),
  longest_count: z.number().int().nonnegative(),
  last_activity_date: z.coerce.date().nullable(),
  is_active: z.boolean(),
  updated_at: z.coerce.date(),
});
export type Streak = z.infer<typeof streakSchema>;

export const badgeSchema = z.object({
  id: z.uuid(),
  slug: badgeSlugSchema,
  name: z.string(),
  description: z.string().nullable(),
  icon_url: z.url().nullable(),
  created_at: z.coerce.date(),
});
export type Badge = z.infer<typeof badgeSchema>;

// A badge joined with the user_badges row that earned it — the shape a
// "my earned badges" query returns.
export const earnedBadgeSchema = badgeSchema.extend({
  awarded_at: z.coerce.date(),
});
export type EarnedBadge = z.infer<typeof earnedBadgeSchema>;

export const xpTransactionSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  amount: z.number().int(),
  reason: z.string(),
  reference_type: z.string().nullable(),
  reference_id: z.uuid().nullable(),
  created_at: z.coerce.date(),
});
export type XpTransaction = z.infer<typeof xpTransactionSchema>;

// Shape returned by the `get_city_leaderboard` RPC.
export const leaderboardEntrySchema = z.object({
  user_id: z.uuid(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.url().nullable(),
  total_xp: z.coerce.number().int().nonnegative(),
  outside_streak_current: z.coerce.number().int().nonnegative(),
  rank: z.coerce.number().int().positive(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export const challengeTypeSchema = z.enum([
  "visit_places",
  "attend_event",
  "check_in",
  "post_vibe",
  "join_crew",
  "custom",
]);
export type ChallengeType = z.infer<typeof challengeTypeSchema>;

export const challengeSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  type: challengeTypeSchema,
  // requirements/progress key convention is engine-defined, not a fixed
  // shape — see 20261008000500_home_and_crews_hub.sql's comment.
  requirements: z.record(z.string(), z.unknown()),
  xp_reward: z.number().int().nonnegative(),
  city_id: z.uuid().nullable(),
  start_at: z.coerce.date(),
  end_at: z.coerce.date(),
  status: z.enum(["draft", "active", "ended"]),
});
export type Challenge = z.infer<typeof challengeSchema>;

// A challenge joined with the viewer's own challenge_participants row, if
// they've joined it.
export const challengeWithParticipationSchema = challengeSchema.extend({
  progress: z.record(z.string(), z.unknown()).nullable(),
  completed_at: z.coerce.date().nullable(),
  joined_at: z.coerce.date().nullable(),
});
export type ChallengeWithParticipation = z.infer<typeof challengeWithParticipationSchema>;
