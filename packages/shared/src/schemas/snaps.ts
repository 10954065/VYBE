import { z } from "zod";

/** Mirrors messages.media_duration_ms's check (with a little slack for camera timing). */
export const SNAP_MAX_VIDEO_MS = 10_000;
/** Mirrors send_snap's too_many_recipients check. */
export const SNAP_MAX_RECIPIENTS = 15;
/** How long a photo snap stays on screen once opened. */
export const SNAP_PHOTO_SECONDS = 10;

export const snapMediaTypeSchema = z.enum(["image", "video"]);
export type SnapMediaType = z.infer<typeof snapMediaTypeSchema>;

// A row of the get_snap_recipients RPC.
export const snapRecipientSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.url().nullable(),
  is_friend: z.boolean(),
  streak_count: z.number().int().nonnegative(),
});
export type SnapRecipient = z.infer<typeof snapRecipientSchema>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Today in Accra as YYYY-MM-DD, the day streaks count in. Accra is UTC+0
 * all year, so this is the UTC date (the database's accra_today()).
 */
export function accraToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function previousDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
}

export interface StreakState {
  /** Days in a row both people snapped; 0 once a day has been missed. */
  count: number;
  /** Alive, but ends at midnight unless both snap today. */
  endsTonight: boolean;
}

/**
 * The streak a conversation shows today. Mirrors get_inbox: a streak whose
 * last completed day is today or yesterday is alive; anything older was
 * broken by a missed day.
 */
export function liveStreak(
  conversation: { streak_day: string | null; streak_count: number },
  today: string = accraToday(),
): StreakState {
  const { streak_day: day, streak_count: count } = conversation;
  if (!day || count <= 0) return { count: 0, endsTonight: false };
  if (day === today) return { count, endsTonight: false };
  if (day === previousDay(today)) return { count, endsTonight: true };
  return { count: 0, endsTonight: false };
}
