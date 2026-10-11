/** The `slug_format` checks: crews `^[a-z0-9-]{3,40}$`, events `^[a-z0-9-]{3,60}$`. */
export const CREW_SLUG_MAX_LENGTH = 40;
export const EVENT_SLUG_MAX_LENGTH = 60;

const SUFFIX_LENGTH = 6;

/**
 * A readable, unique slug that fits the table's slug_format constraint:
 * the input hyphenated, truncated so that it plus a `-xxxxxx` random suffix
 * stays within `maxLength`.
 */
export function slugify(input: string, maxLength: number): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength - SUFFIX_LENGTH - 1)
    .replace(/-+$/, '');
  const suffix = Math.random()
    .toString(36)
    .slice(2, 2 + SUFFIX_LENGTH)
    .padEnd(SUFFIX_LENGTH, '0');
  return `${base || 'item'}-${suffix}`;
}
