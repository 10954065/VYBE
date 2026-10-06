/**
 * Map provider abstraction. Call sites depend on this interface, never on
 * a concrete SDK (MapLibre/Mapbox/Google), so the provider can be swapped
 * later without touching feature code.
 */
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapCamera {
  center: LatLng;
  zoom: number;
}

export interface GeocodeResult {
  label: string;
  position: LatLng;
}

export interface MapProvider {
  readonly id: "maplibre" | "mapbox" | "google";
  geocode(query: string): Promise<GeocodeResult[]>;
  reverseGeocode(position: LatLng): Promise<GeocodeResult | null>;
  distanceMeters(a: LatLng, b: LatLng): number;
}

/** Haversine distance — shared by every provider implementation. */
export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const earthRadiusMeters = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

/**
 * Rounds a precise location down to a coarse grid so it can be shown
 * publicly (e.g. "near Osu") without exposing the user's exact position.
 */
export function toApproximateLocation(position: LatLng, precisionKm = 1): LatLng {
  const degreesPerKm = 1 / 111; // ~111km per degree of latitude
  const step = precisionKm * degreesPerKm;
  return {
    lat: Math.round(position.lat / step) * step,
    lng: Math.round(position.lng / step) * step,
  };
}
