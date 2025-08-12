import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function TerminalEntry() {
  const { id } = useParams(); // table_id, e.g. "T-07"

  useEffect(() => {
    const go = async () => {
      if (!id) return;

      // Ask the DB to create a brand-new session for this terminal
      const { data, error } = await supabase.rpc("start_terminal_session", {
        p_table_id: id,
      });

      if (error || !data) {
        console.error("start_terminal_session error:", error);
        // TODO: render a nicer error UI if desired
        return;
      }

      const sessionCode = data as string;
      const url = new URL("/menu", window.location.origin);
      url.searchParams.set("table", id);
      url.searchParams.set("session", sessionCode);
      window.location.replace(url.toString());
    };

    go();
  }, [id]);

  return (
    <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
      Starting your session…
    </div>
  );
}
