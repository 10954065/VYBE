import { z } from "zod";
import { INTERESTS } from "../constants/interests";

/** Mirrors the `profiles` table. */
export const profileSchema = z.object({
  id: z.uuid(),
  username: z
    .string()
    .regex(/^[a-z0-9_.]{3,30}$/, "Lowercase letters, numbers, '_' and '.' only, 3-30 characters."),
  display_name: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.url().nullable(),
  city_id: z.uuid().nullable(),
  onboarding_completed_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export type ProfileRow = z.infer<typeof profileSchema>;

/** Input for the onboarding completion step. */
export const completeOnboardingInputSchema = z.object({
  username: z
    .string()
    .regex(/^[a-z0-9_.]{3,30}$/, "Lowercase letters, numbers, '_' and '.' only, 3-30 characters."),
  display_name: z.string().min(1).max(60),
  city_id: z.uuid(),
  interests: z.array(z.enum(INTERESTS)).min(1).max(INTERESTS.length),
  avatar_url: z.url().optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingInputSchema>;

/** Input for editing an existing profile. Every field optional (partial update). */
export const updateProfileInputSchema = profileSchema
  .pick({ display_name: true, bio: true, avatar_url: true, city_id: true })
  .partial();

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
