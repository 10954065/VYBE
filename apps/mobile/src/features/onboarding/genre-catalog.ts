import type { Genre } from '@vybe/shared';

interface GenreCatalogEntry {
  genre: Genre;
  emoji: string;
  name: string;
  tag: string;
  artists: string;
  areaLabel: string;
}

/** Display copy for each selectable genre — ported from the Stitch onboarding export. */
export const GENRE_CATALOG: GenreCatalogEntry[] = [
  {
    genre: 'afrobeats',
    emoji: '🎵',
    name: 'Afrobeats & Live Horns',
    tag: 'High energy',
    artists: 'Burna Boy, Wizkid, Gyakie',
    areaLabel: 'Osu & Labone clubs',
  },
  {
    genre: 'amapiano',
    emoji: '🔊',
    name: 'Amapiano & Deep Log Drums',
    tag: 'Heavy bass',
    artists: 'Kabza De Small, Uncle Waffles, Tyler ICU',
    areaLabel: 'Airport & Cantonments',
  },
  {
    genre: 'highlife',
    emoji: '🎹',
    name: 'Ghanaian Highlife & Palm Wine',
    tag: 'Heritage acoustic',
    artists: 'E.T. Mensah, Santrofi, Kyekyeku',
    areaLabel: 'Jamestown & Dzorwulu',
  },
  {
    genre: 'alte',
    emoji: '🎧',
    name: 'Alté & Neo-Soul',
    tag: 'Chill vibe',
    artists: 'Tems, Odunsi (The Engine), Santi',
    areaLabel: 'East Legon lounges',
  },
  {
    genre: 'drill',
    emoji: '🥁',
    name: 'Asakaa Drill & Hip-Hop',
    tag: 'Raw energy',
    artists: 'Yaw TOG, Black Sherif, Kweku Smoke',
    areaLabel: 'Spintex & Osu underground',
  },
  {
    genre: 'afrohouse',
    emoji: '🌀',
    name: 'Afro-House & Electronic',
    tag: 'Hypnotic',
    artists: 'Black Coffee, Caiiro, Shimza',
    areaLabel: 'Labadi Beachfront',
  },
];
