import { describe, expect, it } from 'vitest';

import { CREW_SLUG_MAX_LENGTH, EVENT_SLUG_MAX_LENGTH, slugify } from './slugify';

// The database's slug_format checks: crews ^[a-z0-9-]{3,40}$, events ^[a-z0-9-]{3,60}$.
const crewSlugFormat = /^[a-z0-9-]{3,40}$/;
const eventSlugFormat = /^[a-z0-9-]{3,60}$/;

describe('slugify', () => {
  it('lowercases and hyphenates, with a random suffix so slugs stay unique', () => {
    const slug = slugify('Amapiano Saturdays!', EVENT_SLUG_MAX_LENGTH);
    expect(slug).toMatch(/^amapiano-saturdays-[a-z0-9]{6}$/);
    expect(slugify('Amapiano Saturdays!', EVENT_SLUG_MAX_LENGTH)).not.toBe(slug);
  });

  it('keeps a long crew name within the crews slug limit (regression: names over ~33 characters failed to save)', () => {
    const slug = slugify('Accra Amapiano and Afrobeats Lovers Society', CREW_SLUG_MAX_LENGTH);
    expect(slug).toMatch(crewSlugFormat);
  });

  it('never ends the readable part with a hyphen after truncating', () => {
    const slug = slugify('abcdefghijklmnopqrstuvwxyz abcdefghij more', CREW_SLUG_MAX_LENGTH);
    expect(slug).not.toMatch(/--/);
  });

  it('falls back to a generic base when nothing slug-safe is left', () => {
    expect(slugify('!!! 🎉 ???', CREW_SLUG_MAX_LENGTH)).toMatch(/^item-[a-z0-9]{6}$/);
  });

  it.each([
    ['crews', CREW_SLUG_MAX_LENGTH, crewSlugFormat],
    ['events', EVENT_SLUG_MAX_LENGTH, eventSlugFormat],
  ])('always satisfies the %s slug constraint, for any input length', (_table, maxLength, format) => {
    for (let length = 0; length <= 130; length += 7) {
      const input = 'Vybe Night Out '.repeat(10).slice(0, length);
      expect(slugify(input, maxLength)).toMatch(format);
    }
  });
});
