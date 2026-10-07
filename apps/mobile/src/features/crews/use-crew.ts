import { useQuery } from "@tanstack/react-query";
import { crewSchema, type Crew } from "@vybe/shared";

import { supabase } from "@/lib/supabase/client";

export function useCrew(crewId: string | undefined) {
  return useQuery({
    queryKey: ["crew", crewId],
    enabled: !!crewId,
    queryFn: async (): Promise<Crew> => {
      const { data, error } = await supabase.from("crews").select("*").eq("id", crewId!).single();
      if (error) throw error;
      return crewSchema.parse(data);
    },
  });
}
