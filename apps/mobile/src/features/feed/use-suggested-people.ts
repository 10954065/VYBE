import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

const suggestedPersonSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.url().nullable(),
});
export type SuggestedPerson = z.infer<typeof suggestedPersonSchema>;

export function useSuggestedPeople() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["suggested-people", userId],
    enabled: !!userId,
    queryFn: async (): Promise<SuggestedPerson[]> => {
      const { data, error } = await supabase.rpc("get_suggested_people", { result_limit: 10 });
      if (error) throw error;
      return (data ?? []).map((row) => suggestedPersonSchema.parse(row));
    },
  });
}
