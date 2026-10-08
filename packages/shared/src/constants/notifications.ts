/**
 * Mirrors the `type` check constraint on `notifications`
 * (20261006212805_notifications.sql, extended by
 * 20261008000900_notifications_engine.sql). `recommendation` has no trigger
 * yet — it's Phase 9 (Discovery) territory, same "schema exists, nothing
 * writes it yet" honesty as the streak_types this project doesn't compute.
 */
export const NOTIFICATION_TYPES = [
  "like",
  "comment",
  "follow",
  "crew_activity",
  "event_reminder",
  "challenge_completed",
  "streak_milestone",
  "xp_milestone",
  "badge_earned",
  "recommendation",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Display-only emoji per notification type, same pattern as BADGE_ICONS. */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  like: "❤️",
  comment: "💬",
  follow: "➕",
  crew_activity: "🏗️",
  event_reminder: "⏰",
  challenge_completed: "🏆",
  streak_milestone: "🔥",
  xp_milestone: "⭐",
  badge_earned: "🎖️",
  recommendation: "✨",
};

/**
 * Streak lengths that trigger a streak_milestone notification — must stay
 * in sync with handle_streak_milestone_notification's v_milestones array in
 * 20261008000900_notifications_engine.sql.
 */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;
