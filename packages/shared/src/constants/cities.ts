/**
 * Cities VYBE operates in. Launch city is Accra; entries are added here —
 * never hardcoded elsewhere — as the product expands to new cities.
 */
export interface City {
  slug: string;
  name: string;
  country: string;
  timezone: string;
  isLaunched: boolean;
  centerLat: number;
  centerLng: number;
}

export const CITIES: readonly City[] = [
  {
    slug: "accra",
    name: "Accra",
    country: "GH",
    timezone: "Africa/Accra",
    isLaunched: true,
    centerLat: 5.6037,
    centerLng: -0.187,
  },
  {
    slug: "kumasi",
    name: "Kumasi",
    country: "GH",
    timezone: "Africa/Accra",
    isLaunched: false,
    centerLat: 6.6885,
    centerLng: -1.6244,
  },
  {
    slug: "tema",
    name: "Tema",
    country: "GH",
    timezone: "Africa/Accra",
    isLaunched: false,
    centerLat: 5.6698,
    centerLng: -0.0166,
  },
  {
    slug: "takoradi",
    name: "Takoradi",
    country: "GH",
    timezone: "Africa/Accra",
    isLaunched: false,
    centerLat: 4.8845,
    centerLng: -1.7554,
  },
  {
    slug: "cape-coast",
    name: "Cape Coast",
    country: "GH",
    timezone: "Africa/Accra",
    isLaunched: false,
    centerLat: 5.1053,
    centerLng: -1.2466,
  },
  {
    slug: "tamale",
    name: "Tamale",
    country: "GH",
    timezone: "Africa/Accra",
    isLaunched: false,
    centerLat: 9.4035,
    centerLng: -0.8393,
  },
] as const;

export const DEFAULT_CITY_SLUG = "accra";

export const LAUNCHED_CITIES: readonly City[] = CITIES.filter((city) => city.isLaunched);
