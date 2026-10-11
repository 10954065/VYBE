const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a) === startOfDay(b);
}

/** "8:22 PM" (or the device's own clock format). */
export function formatMessageTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

/** The divider above a day's messages: Today, Yesterday, a weekday this week, else a date. */
export function formatDayLabel(date: Date, now: Date = new Date()): string {
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
}
