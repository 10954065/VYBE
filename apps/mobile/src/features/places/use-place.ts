import { useQuery } from "@tanstack/react-query";
import { placeSchema, type Place } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

export function usePlace(placeId: string | undefined) {
  return useQuery({
    queryKey: ["place", placeId],
    enabled: !!placeId,
    queryFn: async (): Promise<Place> => {
      const { data, error } = await supabase.from("places").select("*").eq("id", placeId!).single();
      if (error) throw error;
      return placeSchema.parse(data);
    },
  });
}
