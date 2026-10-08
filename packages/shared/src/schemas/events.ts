import { z } from "zod";

import { postVisibilitySchema } from "./posts";

export const eventSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  cover_image_url: z.url().nullable(),
  category: z.string().nullable(),
  place_id: z.uuid().nullable(),
  city_id: z.uuid().nullable(),
  organizer_id: z.uuid(),
  business_id: z.uuid().nullable(),
  crew_id: z.uuid().nullable(),
  start_at: z.coerce.date(),
  end_at: z.coerce.date().nullable(),
  capacity: z.number().int().nullable(),
  visibility: postVisibilitySchema,
  status: z.enum(["draft", "published", "cancelled", "completed"]),
  // Display-only copy (e.g. "Free", "GH₵150") — never wired to real payment
  // or ticketing. RSVP via event_attendees stays free regardless.
  price_label: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Event = z.infer<typeof eventSchema>;

// Event joined with its place name, as shown in a city-scoped events list.
export const eventListItemSchema = eventSchema.extend({
  place_name: z.string().nullable(),
});
export type EventListItem = z.infer<typeof eventListItemSchema>;

export const createEventInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.string().optional(),
  place_id: z.uuid().optional(),
  start_at: z.coerce.date(),
  end_at: z.coerce.date().optional(),
  capacity: z.number().int().positive().optional(),
  visibility: postVisibilitySchema.default("everyone"),
  price_label: z.string().trim().max(40).optional(),
});
export type CreateEventInput = z.infer<typeof createEventInputSchema>;

export const attendeeStatusSchema = z.enum(["interested", "going", "checked_in", "cancelled"]);
export type AttendeeStatus = z.infer<typeof attendeeStatusSchema>;

export const rsvpInputSchema = z.object({
  event_id: z.uuid(),
  status: z.enum(["interested", "going", "cancelled"]),
});
export type RsvpInput = z.infer<typeof rsvpInputSchema>;

export const attendeeSummarySchema = z.object({
  interested_count: z.coerce.number().int().nonnegative(),
  going_count: z.coerce.number().int().nonnegative(),
  checked_in_count: z.coerce.number().int().nonnegative(),
  viewer_status: attendeeStatusSchema.nullable(),
});
export type AttendeeSummary = z.infer<typeof attendeeSummarySchema>;

// Shape returned by the `get_home_highlight_events` RPC ("Happening
// Tonight") — events starting in the next 18 hours with attendee counts
// already flattened in.
export const homeHighlightEventSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  cover_image_url: z.url().nullable(),
  place_id: z.uuid().nullable(),
  place_name: z.string().nullable(),
  start_at: z.coerce.date(),
  price_label: z.string().nullable(),
  interested_count: z.coerce.number().int().nonnegative(),
  going_count: z.coerce.number().int().nonnegative(),
  viewer_status: attendeeStatusSchema.nullable(),
});
export type HomeHighlightEvent = z.infer<typeof homeHighlightEventSchema>;

// Shape returned by the `get_events_with_stats` RPC — Discover's broader
// upcoming-events list (vs. Home's next-18h highlight window), with the
// same attendee-count flattening.
export const eventWithStatsSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  cover_image_url: z.url().nullable(),
  category: z.string().nullable(),
  place_id: z.uuid().nullable(),
  place_name: z.string().nullable(),
  start_at: z.coerce.date(),
  end_at: z.coerce.date().nullable(),
  price_label: z.string().nullable(),
  interested_count: z.coerce.number().int().nonnegative(),
  going_count: z.coerce.number().int().nonnegative(),
  viewer_status: attendeeStatusSchema.nullable(),
});
export type EventWithStats = z.infer<typeof eventWithStatsSchema>;
