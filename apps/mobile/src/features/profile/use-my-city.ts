import { useQuery } from "@tanstack/react-query";
import { citySchema, type CityRow } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

export function useMyCity() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["city", cityId],
    enabled: !!cityId,
    queryFn: async (): Promise<CityRow> => {
      const { data, error } = await supabase.from("cities").select("*").eq("id", cityId!).single();
      if (error) throw error;
      return citySchema.parse(data);
    },
  });
}
