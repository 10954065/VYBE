import { z } from "zod";

export const REPORT_TARGET_TYPES = ["post", "user", "event", "crew", "comment", "place", "business"] as const;
export const reportTargetTypeSchema = z.enum(REPORT_TARGET_TYPES);
export type ReportTargetType = z.infer<typeof reportTargetTypeSchema>;

export const REPORT_CATEGORIES = [
  "spam",
  "harassment",
  "hate",
  "sexual_content",
  "violence",
  "scam",
  "fake_account",
  "other",
] as const;
export const reportCategorySchema = z.enum(REPORT_CATEGORIES);
export type ReportCategory = z.infer<typeof reportCategorySchema>;

export const REPORT_STATUSES = ["pending", "reviewing", "resolved", "dismissed"] as const;
export const reportStatusSchema = z.enum(REPORT_STATUSES);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const createReportInputSchema = z.object({
  target_type: reportTargetTypeSchema,
  target_id: z.uuid(),
  category: reportCategorySchema,
  details: z.string().trim().max(1000).optional(),
});
export type CreateReportInput = z.infer<typeof createReportInputSchema>;

// Shape returned by the `get_my_blocks` RPC.
export const blockedUserSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.url().nullable(),
  blocked_at: z.coerce.date(),
});
export type BlockedUser = z.infer<typeof blockedUserSchema>;
