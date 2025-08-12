import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Keeps the session alive while the customer is browsing.
 * Touches `last_seen_at` once on mount and every 60 seconds.
 */
export function useSessionHeartbeat(sessionCode?: string) {
  useEffect(() => {
    if (!sessionCode) return;

    // Initial touch
    supabase.rpc("touch_session", { p_session_code: sessionCode });

    const id = setInterval(() => {
      supabase.rpc("touch_session", { p_session_code: sessionCode });
    }, 60_000);

    return () => clearInterval(id);
  }, [sessionCode]);
}
