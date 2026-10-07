import { useQuery } from "@tanstack/react-query";
import { profileSchema, type ProfileRow } from "@vybe/shared";
import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

export function useProfile() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<ProfileRow> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).single();
      if (error) throw error;
      return profileSchema.parse(data);
    },
    enabled: !!userId,
  });
}
