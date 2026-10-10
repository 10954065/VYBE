import { useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { flush, identify, track } from './analytics';

/**
 * Route pattern without group segments, e.g. `post/[id]` rather than
 * `(app)/post/[id]` or a concrete id, so screen views aggregate per screen
 * and never carry content ids. Null for the bare root, which only ever
 * redirects (to sign-in, onboarding, or home) and isn't a screen anyone sees.
 */
function screenName(segments: readonly string[]): string | null {
  const visible = segments.filter((segment) => !segment.startsWith('('));
  return visible.length > 0 ? visible.join('/') : null;
}

interface AnalyticsIdentity {
  userId: string | null;
  cityId: string | null;
  /** False while the session/profile are still loading. */
  isReady: boolean;
}

/** Wires app-level analytics: launch, identity, screen views, and flushing. */
export function useAnalyticsLifecycle({ userId, cityId, isReady }: AnalyticsIdentity) {
  const segments = useSegments();
  const screen = screenName(segments);
  const hasTrackedLaunch = useRef(false);

  // Declared first so identity is set before the events below are tracked.
  useEffect(() => {
    if (isReady) void identify(userId, cityId);
  }, [isReady, userId, cityId]);

  useEffect(() => {
    if (!isReady || hasTrackedLaunch.current) return;
    hasTrackedLaunch.current = true;
    track('app_opened');
  }, [isReady]);

  useEffect(() => {
    if (isReady && screen) track('screen_viewed', { screen });
  }, [isReady, screen]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') void flush();
    });
    return () => subscription.remove();
  }, []);
}
