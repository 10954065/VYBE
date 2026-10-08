import type { CrewPreference, DefaultCheckInVisibility, NightlifePace, TravelRadius } from '@vybe/shared';

export const PACE_OPTIONS: { value: NightlifePace; emoji: string; title: string; tag: string; subtitle: string; description: string }[] = [
  {
    value: 'night_owl',
    emoji: '🌙',
    title: 'The Night Owl',
    tag: 'Peak chaos',
    subtitle: 'Out till sunrise • starts after 11 PM',
    description: 'High-energy clubs, Amapiano raves, and private afterparties. Accra never sleeps, and neither do you.',
  },
  {
    value: 'sundowner',
    emoji: '🍹',
    title: 'Sundowner & Social Chill',
    tag: 'Golden hour',
    subtitle: 'Golden hour drinks • home by 1 AM',
    description: 'Golden hour drinks, live acoustic bands, open breezy courtyards, and deep conversations.',
  },
  {
    value: 'explorer',
    emoji: '🧭',
    title: 'Spontaneous Explorer',
    tag: 'Radar-led',
    subtitle: 'Labone ↔ Osu jumps',
    description: 'Wherever the feed glows. Hopping from rooftop to street lounge on pure instinct.',
  },
];

export const CREW_OPTIONS: { value: CrewPreference; emoji: string; title: string; subtitle: string; description: string }[] = [
  {
    value: 'squad',
    emoji: '👥',
    title: 'Squad Commander',
    subtitle: 'Prefers crew-first nights out',
    description: 'Prioritize VIP cabana passes, table reservations, bill splitting, and group entry wristbands.',
  },
  {
    value: 'solo',
    emoji: '🛰️',
    title: 'Solo Roamer & Open to Meet',
    subtitle: 'Social mixers & open creator tables',
    description: 'Connect with like-minded creators, spontaneous wingmen, and curated networking.',
  },
];

export const PRIVACY_OPTIONS: { value: DefaultCheckInVisibility; emoji: string; title: string; subtitle: string; description: string }[] = [
  {
    value: 'followers',
    emoji: '🛡️',
    title: 'Mutual Friends & Squad Only',
    subtitle: 'Default for new check-ins',
    description: "Friends see when you're checked in. Fully concealed from strangers.",
  },
  {
    value: 'only_me',
    emoji: '🕶️',
    title: 'Incognito Ghost Mode',
    subtitle: 'Default for new check-ins',
    description: 'No live check-in broadcast — browse entirely off-grid.',
  },
];

export const RADIUS_OPTIONS: { value: TravelRadius; emoji: string; title: string; subtitle: string }[] = [
  { value: 'hood', emoji: '🚶', title: 'My hood only', subtitle: '< 3km from current zone' },
  { value: 'central', emoji: '🚕', title: 'Across Central Accra', subtitle: '< 10km (Osu, Labone, Legon corridor)' },
  { value: 'anywhere', emoji: '🚀', title: 'Anywhere with good energy', subtitle: 'All Greater Accra metro zone' },
];
