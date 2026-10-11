import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from './format-relative-time';
import { formatDistanceKm, haversineDistanceKm } from './geo';
import { getErrorMessage } from './get-error-message';

describe('getErrorMessage', () => {
  it('explains a database rate limit instead of showing its code', () => {
    expect(getErrorMessage(new Error('rate_limited'))).toMatch(/try again in a minute/);
  });

  it('explains an upload refused by the Storage upload limit', () => {
    expect(getErrorMessage(new Error('database error, code: P0001'))).toMatch(/uploading a lot/);
  });

  it('explains why someone cannot be messaged yet', () => {
    expect(getErrorMessage(new Error('cannot_message'))).toMatch(/once they follow you/);
  });

  it('passes other errors through', () => {
    expect(getErrorMessage(new Error('Invalid login credentials'))).toBe('Invalid login credentials');
  });

  it('falls back for things that are not errors', () => {
    expect(getErrorMessage('boom')).toBe('Something went wrong. Please try again.');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  it.each([
    ['2026-10-10T11:59:30Z', 'just now'],
    ['2026-10-10T11:15:00Z', '45m'],
    ['2026-10-10T09:00:00Z', '3h'],
    ['2026-10-08T12:00:00Z', '2d'],
    ['2026-09-20T12:00:00Z', '2w'],
    ['2026-10-10T12:05:00Z', 'just now'],
  ])('%s is "%s"', (when, expected) => {
    expect(formatRelativeTime(new Date(when), now)).toBe(expected);
  });
});

describe('distance', () => {
  it('measures Oxford Street, Osu to Labadi Beach at about 3.8 km', () => {
    const km = haversineDistanceKm(5.5560, -0.1820, 5.5600, -0.1480);
    expect(km).toBeGreaterThan(3.5);
    expect(km).toBeLessThan(4);
  });

  it('formats short distances in metres and longer ones in km', () => {
    expect(formatDistanceKm(0.25)).toBe('250 m away');
    expect(formatDistanceKm(3.74)).toBe('3.7 km away');
  });
});
