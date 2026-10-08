import { z } from "zod";

import { NOTIFICATION_TYPES } from "../constants/notifications";

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

// The actor is nullable at the DB level (several notification types, like
// xp_milestone or event_reminder, have no human actor) and the embed itself
// can come back null when actor_id is null, so both layers are optional.
export const notificationActorSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.url().nullable(),
});
export type NotificationActor = z.infer<typeof notificationActorSchema>;

export const notificationSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  actor_id: z.uuid().nullable(),
  actor: notificationActorSchema.nullable(),
  type: notificationTypeSchema,
  target_type: z.string().nullable(),
  target_id: z.uuid().nullable(),
  body: z.string().nullable(),
  read_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const notificationPreferencesSchema = z.object({
  user_id: z.uuid(),
  likes: z.boolean(),
  comments: z.boolean(),
  follows: z.boolean(),
  crew_activity: z.boolean(),
  event_reminders: z.boolean(),
  challenges: z.boolean(),
  streaks: z.boolean(),
  xp_milestones: z.boolean(),
  badges: z.boolean(),
  recommendations: z.boolean(),
  push_enabled: z.boolean(),
});
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const updateNotificationPreferencesInputSchema = notificationPreferencesSchema.omit({ user_id: true }).partial();
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesInputSchema>;

export const pushTokenPlatformSchema = z.enum(["ios", "android", "web"]);

export const registerPushTokenInputSchema = z.object({
  token: z.string().min(1),
  platform: pushTokenPlatformSchema,
});
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenInputSchema>;
