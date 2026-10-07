import { useQuery } from "@tanstack/react-query";
import { crewSchema, type Crew } from "@vybe/shared";

import { useProfile } from "@/features/profile/use-profile";
import { supabase } from "@/lib/supabase/client";

export function useCrews() {
  const { data: profile } = useProfile();
  const cityId = profile?.city_id;

  return useQuery({
    queryKey: ["crews", cityId],
    enabled: !!cityId,
    queryFn: async (): Promise<Crew[]> => {
      const { data, error } = await supabase
        .from("crews")
        .select("*")
        .eq("city_id", cityId!)
        .order("member_count", { ascending: false })
        .order("name", { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((row) => crewSchema.parse(row));
    },
  });
}
