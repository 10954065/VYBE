import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";

export interface DeviceLocation {
  lat: number;
  lng: number;
}

/**
 * The device's current position, if the user grants permission. Returns
 * null (not an error) on denial or unavailability — "Nearby" sorting and
 * distance chips simply don't render rather than faking a location. This
 * is the first use of expo-location in the app; there is no other
 * location-tracking anywhere else.
 */
export function useDeviceLocation() {
  return useQuery({
    queryKey: ["device-location"],
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<DeviceLocation | null> => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    },
  });
}
