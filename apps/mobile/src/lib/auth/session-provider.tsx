import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { supabase } from "@/lib/supabase/client";

interface SessionContextValue {
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return value;
}

/**
 * Tracks the Supabase auth session reactively. Persistence/refresh is
 * handled by the Supabase client itself (see lib/supabase/client.ts) — this
 * just mirrors its current state into React so routing can react to it.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ session, isLoading }), [session, isLoading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
