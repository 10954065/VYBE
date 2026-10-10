import { identify } from '@/lib/analytics/analytics';
import { supabase } from '@/lib/supabase/client';

/**
 * Signs out after sending any queued analytics events, which are only
 * accepted while the session they were tracked under is still valid.
 */
export async function signOut(): Promise<void> {
  await identify(null, null).catch(() => undefined);
  await supabase.auth.signOut();
}
