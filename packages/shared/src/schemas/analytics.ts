import { z } from "zod";

import { NOTIFICATION_TYPES } from "../constants/notifications";
import { VIBE_TYPES } from "../constants/vibes";
import { crewPrivacySchema } from "./crews";
import { POST_VISIBILITIES } from "./posts";
import { REPORT_CATEGORIES, REPORT_TARGET_TYPES } from "./moderation";

/**
 * The product analytics catalog: every event the app may send, with the
 * exact properties it may carry. Properties are deliberately low-cardinality
 * and free of personal content — no post bodies, search text, emails, or
 * coordinates — so the same payload can go to our own `analytics_events`
 * table and to PostHog without a privacy review per call site.
 */
const empty = z.object({}).strict();

export const analyticsEventSchemas = {
  app_opened: empty,
  screen_viewed: z.object({ screen: z.string().min(1).max(120) }).strict(),
  signed_up: empty,
  signed_in: empty,
  onboarding_completed: z
    .object({ genre_count: z.number().int().min(0), neighborhood_count: z.number().int().min(0) })
    .strict(),
  post_created: z.object({ visibility: z.enum(POST_VISIBILITIES), in_crew: z.boolean() }).strict(),
  comment_added: z.object({ is_reply: z.boolean() }).strict(),
  reaction_added: z.object({ target: z.enum(["post", "check_in"]) }).strict(),
  check_in_created: z.object({ at_event: z.boolean() }).strict(),
  vibe_shared: z.object({ vibe_type: z.enum(VIBE_TYPES) }).strict(),
  event_created: z.object({ category: z.string().max(40) }).strict(),
  event_rsvp: z.object({ status: z.enum(["interested", "going", "cancelled"]) }).strict(),
  crew_created: z.object({ privacy: crewPrivacySchema }).strict(),
  crew_joined: empty,
  challenge_joined: empty,
  user_followed: empty,
  user_blocked: empty,
  report_submitted: z
    .object({ target_type: z.enum(REPORT_TARGET_TYPES), category: z.enum(REPORT_CATEGORIES) })
    .strict(),
  search_performed: z
    .object({ query_length: z.number().int().min(1).max(200), result_count: z.number().int().min(0) })
    .strict(),
  content_shared: z
    .object({
      entity: z.enum(["post", "place", "event", "crew", "profile"]),
      outcome: z.enum(["shared", "copied", "cancelled"]),
    })
    .strict(),
  notification_opened: z.object({ type: z.enum(NOTIFICATION_TYPES) }).strict(),
} as const;

export type AnalyticsEventName = keyof typeof analyticsEventSchemas;
export type AnalyticsEventProperties<E extends AnalyticsEventName> = z.infer<(typeof analyticsEventSchemas)[E]>;

export const ANALYTICS_EVENT_NAMES = Object.keys(analyticsEventSchemas) as AnalyticsEventName[];

/** Mirrors the `analytics_events_event_name_format` check constraint. */
export const ANALYTICS_EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{2,63}$/;

/** Mirrors the `analytics_events_properties_size` check constraint (bytes). */
export const ANALYTICS_MAX_PROPERTIES_BYTES = 4096;

/** Date ranges the admin analytics page offers. */
export const ANALYTICS_RANGES_DAYS = [7, 30, 90] as const;
export type AnalyticsRangeDays = (typeof ANALYTICS_RANGES_DAYS)[number];

/** Shape returned by the `get_analytics_overview` RPC. */
export const analyticsOverviewSchema = z.object({
  range_days: z.number().int(),
  totals: z.object({
    signups: z.number().int(),
    onboarded: z.number().int(),
    active_users: z.number().int(),
    sessions: z.number().int(),
    posts: z.number().int(),
    check_ins: z.number().int(),
    events_created: z.number().int(),
    crews_created: z.number().int(),
    reactions: z.number().int(),
    comments: z.number().int(),
  }),
  daily: z.array(
    z.object({
      day: z.string(),
      active_users: z.number().int(),
      signups: z.number().int(),
      posts: z.number().int(),
      check_ins: z.number().int(),
    }),
  ),
  funnel: z.object({
    signed_up: z.number().int(),
    onboarded: z.number().int(),
    first_action: z.number().int(),
    returned: z.number().int(),
  }),
  top_screens: z.array(z.object({ screen: z.string(), views: z.number().int(), users: z.number().int() })),
  top_events: z.array(z.object({ event_name: z.string(), count: z.number().int(), users: z.number().int() })),
});
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;
