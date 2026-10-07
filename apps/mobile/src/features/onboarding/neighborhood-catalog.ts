import type { Neighborhood } from '@vybe/shared';

interface NeighborhoodCatalogEntry {
  neighborhood: Neighborhood;
  name: string;
  description: string;
  tags: string[];
  photoUrl: string;
}

/**
 * Display copy and photos for each selectable neighborhood — ported from
 * the Stitch onboarding export, including its real (publicly reachable)
 * generated photo URLs.
 */
export const NEIGHBORHOOD_CATALOG: NeighborhoodCatalogEntry[] = [
  {
    neighborhood: 'osu',
    name: 'Osu (Oxford St & 14th Lane)',
    description: 'The pulse of Accra — Bloom Bar, Front/Back, Republic Bar',
    tags: ['Courtyards', 'Art & nightlife', 'Cocktails'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqlw6grTrcb24Di3uaHNLl0RH9aGc-7f8y0FnYdd0IedijL5LzisA47Us-tDQdWMdiX5KzRxu-t-gJWU2GHEsGxvfbhAU8DLpIf0pFmLBfJ5y_a9cDyECVAnge0T-XohsNYt5hw1sDDAWMutK6YO5IU6oJp74-2r6oHe10Wpp_saPpQttnq6_L4ulR5n4AEHNIdS-ZXO46DByBY8F517jZNRmDDQSdOVp_PpGf5fLc',
  },
  {
    neighborhood: 'east_legon',
    name: 'East Legon & Boundary Rd',
    description: 'Lounge & high energy — Garage, Mood Bar, Underbridge',
    tags: ['Chic lounges', 'Rooftops', 'VIP tables'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBO1WjesnVGvFej6xai5y7KMUs2VmkGMJQwdisExehpd51une559kIX2qDghyLjvW6nuZdq75hQY0k1gby08bGnAhImYZqNmGBEbKLqWr3xJyhFsm8thKsvj4pKI58NDE4plMfUjHfAiTe8eNuxu6JE3aDNs_19ET9xwWESq9MfcmRE_0CgS8eQ8njbb6C6fi34LvOv-vJkkb6ynmWBmjdEFNu_2mDCfonudN5BsVb',
  },
  {
    neighborhood: 'labone',
    name: 'Labone & Cantonments',
    description: 'Artisanal dining & secret gardens — Bistro 22, Alley Bar',
    tags: ['Speakeasies', 'Cocktails', 'Fine dining'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWSHlopOi_-Wum852O2h5rGffcoBiz8G3g-gTcii4tMP6H3hXmgutRB1Mdvi2ZPdn8uO-WF1lGQLzUa0xxbkXOcDTc6jeO4hmDHUUt-riflgvMoO115hZxi2_-kelU3NKZJ0aXo0SiD-7m5DZ0tzqkgD4t2zW6Cqk71x81UfK3x_SXgLDSlyfobCzNSlea2dWepxxz61wqlrsmboMA2CuJ6_XBNVD7fAgBDP5CAGGE',
  },
  {
    neighborhood: 'airport_city',
    name: 'Airport City & Dzorwulu',
    description: 'Modern lounges & sky bars — Carbon, Skybar25',
    tags: ['Skyline views', 'Late night'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCszDPp6l3EmJuaqWNAHZ3SFUUlbHOA1OMuf9Zo_mLawFtW-BFtCtdEIwuZdAnyUO8AWC0xXwxF7Ncapj_Yphvzsjv0SG9QU7cKbVNkKiOsA7_EVYQXGY8PT8W7WJTQ-EeUNbQEGxiF6iUpcOuuIG5iqULImWOXxnlHwiBNURiAuvCG_ZId9inAcmZVRo6BfEV1wqT1sBa17mkY2r9j9GmEbemWcgQQGpXx6A_rcrpr',
  },
  {
    neighborhood: 'labadi',
    name: 'Labadi Beachfront',
    description: 'Atlantic waves & bonfires — Sandbox Beach Club, Labadi Beach',
    tags: ['Beach raves', 'Sundowners'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDrJkghMazfJtEWDPXuV_TsibmQG4PkT_C33mjsFKxvdRI_f5UGqSQXk_SzfLKmyHK_8qVZHnhgsRuOXwlth_8KUzf0n2cIS6-XZbNvqqjQgHkuPCN6CCySRss16KoQqSmYcFGZXCnyrR3zu1rQeUrT_0VwxW_5Up6K89jEICUYu1hv2pnOkLvXI8N7Bc-PAcpXaaksNCymlsCjBYLj2LkMTNl2L3hDNGvtxL-V3xnV',
  },
  {
    neighborhood: 'jamestown',
    name: 'Jamestown & High Street',
    description: 'Heritage, creative arts & sound systems — Brazil House',
    tags: ['Indie culture', 'Art festivals'],
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDNqhBW7rPpgTvayynrYPw_iAtCtzVLlW4Sb-GzjktEvTYaSemR5S0ts_C5DWDEpJQpk2j7U6JMFtBRW2ZLhP3-v8OAbuEtrr9yNHq7Eya3UaLuzqvMn2S0d0MIVOzh2ei7AouDtpJpLfMsj1gn7GLVoSbaKztvCxzkLvDtgru0FLGp09xF1RezDVhnFuvTSYnR4Q5rbYAoUSV0Y3dYm5JQJ-M2e9rQQyI0J5KxDucx',
  },
];
