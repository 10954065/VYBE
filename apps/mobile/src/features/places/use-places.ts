import { useQuery } from "@tanstack/react-query";
import { placeSchema, type Place } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

export function usePlaces() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["places", cityId],
    enabled: !!cityId,
    queryFn: async (): Promise<Place[]> => {
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("city_id", cityId!)
        .order("popularity_score", { ascending: false })
        .order("name", { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((row) => placeSchema.parse(row));
    },
  });
}
