import { supabase } from "@/lib/supabase";

/**
 * Check if a session is active for the given session code
 */
export const checkSessionActive = async (
  sessionCode: string
): Promise<boolean> => {
  try {
    // If Supabase is not configured, allow access (fallback for development)
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      console.log("🔧 Session check: Database not configured, allowing access");
      return true;
    }

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("session_code", sessionCode)
      .maybeSingle();

    if (error) {
      console.error("❌ Session check error:", error);
      return false;
    }

    const isActive = !!data;
    console.log(
      `🔍 Session check for ${sessionCode}: ${isActive ? "ACTIVE" : "INACTIVE"}`
    );
    return isActive;
  } catch (error) {
    console.error("❌ Session check failed:", error);
    return false;
  }
};

/**
 * Get session details by session code
 */
export const getSessionDetails = async (sessionCode: string) => {
  try {
    // If Supabase is not configured, return null (fallback for development)
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      console.log("🔧 Session details: Database not configured");
      return null;
    }

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("session_code", sessionCode)
      .maybeSingle();

    if (error) {
      console.error("❌ Get session details error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Get session details failed:", error);
    return null;
  }
};

/**
 * Extract session code from URL parameters with mobile browser compatibility
 */
export const getSessionCodeFromUrl = (): string | null => {
  try {
    // First try to get from localStorage (mobile browsers sometimes lose URL params)
    const storedSession = localStorage.getItem("restaurant_session_code");

    // Get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlSession = urlParams.get("session");

    // If we have a URL session, store it and use it
    if (urlSession) {
      localStorage.setItem("restaurant_session_code", urlSession);
      console.log("📱 Session from URL:", urlSession);
      return urlSession;
    }

    // If no URL session but we have stored session, use stored
    if (storedSession) {
      console.log("📱 Session from storage:", storedSession);
      return storedSession;
    }

    console.log("📱 No session found in URL or storage");
    return null;
  } catch (error) {
    console.error("❌ Error getting session code:", error);
    return null;
  }
};

/**
 * Extract table ID from URL parameters with mobile browser compatibility
 */
export const getTableIdFromUrl = (): string | null => {
  try {
    // First try to get from localStorage
    const storedTable = localStorage.getItem("restaurant_table_id");

    // Get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlTable = urlParams.get("table");

    // If we have a URL table, store it and use it
    if (urlTable) {
      localStorage.setItem("restaurant_table_id", urlTable);
      console.log("📱 Table from URL:", urlTable);
      return urlTable;
    }

    // If no URL table but we have stored table, use stored
    if (storedTable) {
      console.log("📱 Table from storage:", storedTable);
      return storedTable;
    }

    console.log("📱 No table found in URL or storage");
    return null;
  } catch (error) {
    console.error("❌ Error getting table ID:", error);
    return null;
  }
};

/**
 * Clear stored session data (for logout/session end)
 */
export const clearSessionData = (): void => {
  try {
    localStorage.removeItem("restaurant_session_code");
    localStorage.removeItem("restaurant_table_id");
    console.log("📱 Session data cleared");
  } catch (error) {
    console.error("❌ Error clearing session data:", error);
  }
};
