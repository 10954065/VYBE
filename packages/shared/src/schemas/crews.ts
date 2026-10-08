import { z } from "zod";

export const crewPrivacySchema = z.enum(["public", "private"]);
export type CrewPrivacy = z.infer<typeof crewPrivacySchema>;

export const crewSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  avatar_url: z.url().nullable(),
  cover_image_url: z.url().nullable(),
  category: z.string().nullable(),
  city_id: z.uuid().nullable(),
  creator_id: z.uuid(),
  privacy: crewPrivacySchema,
  member_count: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Crew = z.infer<typeof crewSchema>;

export const createCrewInputSchema = z.object({
  name: z.string().trim().min(3, "At least 3 characters.").max(60),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(60).optional(),
  privacy: crewPrivacySchema.default("public"),
});
export type CreateCrewInput = z.infer<typeof createCrewInputSchema>;

export const crewRoleSchema = z.enum(["member", "admin", "owner"]);
export type CrewRole = z.infer<typeof crewRoleSchema>;

export const crewMemberStatusSchema = z.enum(["pending", "approved"]);
export type CrewMemberStatus = z.infer<typeof crewMemberStatusSchema>;

// A crew_members row joined with the member's profile.
export const crewMemberSchema = z.object({
  crew_id: z.uuid(),
  user_id: z.uuid(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.url().nullable(),
  role: crewRoleSchema,
  status: crewMemberStatusSchema,
  joined_at: z.coerce.date(),
});
export type CrewMember = z.infer<typeof crewMemberSchema>;

// Shape returned by the `get_my_crews` RPC — the viewer's own approved
// crews with real presence counts flattened in.
export const myCrewSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  avatar_url: z.url().nullable(),
  cover_image_url: z.url().nullable(),
  category: z.string().nullable(),
  member_count: z.number().int().nonnegative(),
  outside_now_count: z.coerce.number().int().nonnegative(),
  friends_inside_count: z.coerce.number().int().nonnegative(),
});
export type MyCrew = z.infer<typeof myCrewSchema>;
