import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ANALYTICS_MAX_PROPERTIES_BYTES,
  analyticsEventSchemas,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from '@vybe/shared';
import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';
import 'react-native-get-random-values';

import { supabase } from '@/lib/supabase/client';

/**
 * Product analytics. Every event goes to our own `analytics_events` table
 * (batched, through the same RLS as everything else), and also to PostHog
 * when EXPO_PUBLIC_POSTHOG_API_KEY is configured. Event names and their
 * properties are fixed by `analyticsEventSchemas` in @vybe/shared.
 */

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

const OPT_OUT_STORAGE_KEY = 'vybe.analytics.opt_out';
const FLUSH_DELAY_MS = 5_000;
const FLUSH_BATCH_SIZE = 20;
// Bounded so an offline device can't grow the queue without limit.
const MAX_QUEUE_SIZE = 200;
// Postgres error classes that mean "this batch will never be accepted"
// (check constraint, RLS, bad input) — retrying them would loop forever.
const PERMANENT_ERROR_PREFIXES = ['22', '23', '42'];

interface QueuedEvent {
  event_name: AnalyticsEventName;
  user_id: string | null;
  city_id: string | null;
  properties: Record<string, string | number | boolean>;
}

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// One id per app launch, so the dashboard can count sessions.
const sessionId = randomId();
const baseProperties = {
  session_id: sessionId,
  platform: Platform.OS,
  app_version: Constants.expoConfig?.version ?? 'unknown',
};

const posthog = POSTHOG_API_KEY
  ? new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST, captureAppLifecycleEvents: false })
  : null;

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;
let identity: { userId: string | null; cityId: string | null } = { userId: null, cityId: null };
let isOptedOut = false;

const optOutLoaded = AsyncStorage.getItem(OPT_OUT_STORAGE_KEY)
  .then((value) => {
    isOptedOut = value === 'true';
    if (isOptedOut) void posthog?.optOut();
  })
  .catch(() => {
    // Unreadable storage: keep the default (opted in), as before this existed.
  });

function scheduleFlush() {
  if (queue.length >= FLUSH_BATCH_SIZE) {
    void flush();
    return;
  }
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flush();
    }, FLUSH_DELAY_MS);
  }
}

async function sendBatch(batch: QueuedEvent[]): Promise<void> {
  const { error } = await supabase.from('analytics_events').insert(batch);
  if (!error) return;

  const isPermanent = PERMANENT_ERROR_PREFIXES.some((prefix) => error.code?.startsWith(prefix));
  if (isPermanent) {
    if (__DEV__) console.warn('[analytics] batch rejected, dropping:', error.message);
    return;
  }
  // Network/server trouble: put the batch back in front for the next flush.
  // Over the cap, the newest events are what's dropped, so the failed batch
  // isn't evicted by whatever was tracked during the failed request.
  queue = [...batch, ...queue].slice(0, MAX_QUEUE_SIZE);
}

/** Sends everything queued so far. Safe to call concurrently. */
export async function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (inFlight) await inFlight;
  // Events tracked at launch can be queued before the stored preference has
  // loaded; never send them if it turns out the user opted out.
  await optOutLoaded;
  if (isOptedOut) queue = [];
  if (queue.length === 0) return;

  const batch = queue;
  queue = [];
  inFlight = sendBatch(batch).finally(() => {
    inFlight = null;
  });
  await inFlight;
  await posthog?.flush().catch(() => undefined);
}

export function track<E extends AnalyticsEventName>(
  eventName: E,
  ...[properties]: Record<string, never> extends AnalyticsEventProperties<E>
    ? [properties?: AnalyticsEventProperties<E>]
    : [properties: AnalyticsEventProperties<E>]
): void {
  if (isOptedOut) return;

  const parsed = analyticsEventSchemas[eventName].safeParse(properties ?? {});
  if (!parsed.success) {
    if (__DEV__) console.warn(`[analytics] invalid properties for ${eventName}:`, parsed.error.message);
    return;
  }

  const eventProperties: QueuedEvent['properties'] = { ...parsed.data, ...baseProperties };
  if (JSON.stringify(eventProperties).length > ANALYTICS_MAX_PROPERTIES_BYTES) {
    if (__DEV__) console.warn(`[analytics] properties too large for ${eventName}, dropping`);
    return;
  }

  queue = [
    ...queue,
    { event_name: eventName, user_id: identity.userId, city_id: identity.cityId, properties: eventProperties },
  ].slice(-MAX_QUEUE_SIZE);
  scheduleFlush();

  if ('screen' in parsed.data) {
    void posthog?.screen(parsed.data.screen, baseProperties);
  } else {
    posthog?.capture(eventName, eventProperties);
  }
}

/**
 * Attributes subsequent events to a user (or to nobody, on sign-out).
 * Events already queued keep the identity they were tracked with, and are
 * flushed right away so they're sent while that user's session is still
 * valid (RLS only accepts a user_id matching the caller) — which is why
 * sign-out awaits this before ending the session (lib/auth/sign-out.ts).
 */
export async function identify(userId: string | null, cityId: string | null): Promise<void> {
  if (identity.userId === userId && identity.cityId === cityId) return;
  const isNewUser = identity.userId !== userId;
  // Switched synchronously so events tracked right after this call are
  // attributed correctly; queued events carry their own user_id already.
  identity = { userId, cityId };
  if (!isNewUser) return;

  if (posthog) {
    if (userId) posthog.identify(userId);
    else posthog.reset();
  }
  await flush();
}

export async function setAnalyticsOptOut(optOut: boolean): Promise<void> {
  isOptedOut = optOut;
  if (optOut) {
    queue = [];
    await posthog?.optOut();
  } else {
    await posthog?.optIn();
  }
  await AsyncStorage.setItem(OPT_OUT_STORAGE_KEY, String(optOut));
}

export async function getAnalyticsOptOut(): Promise<boolean> {
  await optOutLoaded;
  return isOptedOut;
}
