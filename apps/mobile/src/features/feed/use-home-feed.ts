import { useInfiniteQuery } from "@tanstack/react-query";
import { feedPostSchema, type FeedPost } from "@vybe/shared";

import { useSession } from "@/lib/auth/session-provider";
import { supabase } from "@/lib/supabase/client";

const PAGE_SIZE = 20;

type PageParam = { createdAt: string; id: string } | null;

export function useHomeFeed() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useInfiniteQuery({
    queryKey: ["home-feed", userId],
    enabled: !!userId,
    initialPageParam: null as PageParam,
    queryFn: async ({ pageParam }): Promise<FeedPost[]> => {
      const { data, error } = await supabase.rpc("get_home_feed", {
        page_size: PAGE_SIZE,
        before_created_at: pageParam?.createdAt,
        before_id: pageParam?.id,
      });
      if (error) throw error;
      return (data ?? []).map((row) => feedPostSchema.parse(row));
    },
    getNextPageParam: (lastPage): PageParam => {
      if (lastPage.length < PAGE_SIZE) return null;
      const last = lastPage[lastPage.length - 1];
      return { createdAt: last.created_at.toISOString(), id: last.id };
    },
  });
}
