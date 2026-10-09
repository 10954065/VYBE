import { useQuery } from '@tanstack/react-query';
import { socialProofSchema, type SocialProof } from '@vybe/shared';

import { useSession } from '@/lib/auth/session-provider';
import { supabase } from '@/lib/supabase/client';

export function useSocialProof(targetId: string | undefined) {
  const { session } = useSession();
  const viewerId = session?.user.id;

  return useQuery({
    queryKey: ['social-proof', viewerId, targetId],
    enabled: !!viewerId && !!targetId,
    queryFn: async (): Promise<SocialProof> => {
      const { data, error } = await supabase.rpc('get_social_proof', { viewer: viewerId!, target: targetId! }).single();
      if (error) throw error;
      return socialProofSchema.parse(data);
    },
  });
}
