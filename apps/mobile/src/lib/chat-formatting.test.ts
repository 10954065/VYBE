import { describe, expect, it } from 'vitest';

import { formatDayLabel, isSameDay } from './format-chat-time';
import { randomUuid } from './random-uuid';

describe('formatDayLabel', () => {
  const now = new Date(2026, 9, 11, 21, 0); // Sun 11 Oct 2026, 9pm local

  it.each([
    [new Date(2026, 9, 11, 0, 5), 'Today'],
    [new Date(2026, 9, 10, 23, 59), 'Yesterday'],
  ])('%s -> %s', (date, expected) => {
    expect(formatDayLabel(date, now)).toBe(expected);
  });

  it('names the weekday within the last week', () => {
    expect(formatDayLabel(new Date(2026, 9, 7, 12, 0), now)).toBe(
      new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(2026, 9, 7)),
    );
  });

  it('shows a date for anything older, with the year only when it differs', () => {
    expect(formatDayLabel(new Date(2026, 8, 1), now)).not.toMatch(/2026/);
    expect(formatDayLabel(new Date(2025, 8, 1), now)).toMatch(/2025/);
  });
});

describe('isSameDay', () => {
  it('compares calendar days, not 24-hour spans', () => {
    expect(isSameDay(new Date(2026, 9, 11, 0, 1), new Date(2026, 9, 11, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 9, 10, 23, 59), new Date(2026, 9, 11, 0, 1))).toBe(false);
  });
});

describe('randomUuid', () => {
  it('makes version-4 UUIDs the database accepts', () => {
    const id = randomUuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(randomUuid()).not.toBe(id);
  });
});
