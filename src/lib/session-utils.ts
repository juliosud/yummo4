import { supabase } from "@/lib/supabase";

/**
 * Check if a session is active for the given session code
 */
export const checkSessionActive = async (
  sessionCode: string
): Promise<boolean> => {
  try {
    console.log("🔍 Starting session check for:", sessionCode);

    // If Supabase is not configured, allow access (fallback for development)
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      console.log("🔧 Session check: Database not configured, allowing access");
      return true;
    }

    console.log("📡 Making database request for session:", sessionCode);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("session_code", sessionCode)
      .maybeSingle();

    if (error) {
      console.error("❌ Session check error:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("📊 Database response:", data);
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
    console.log("📱 Getting session code...");
    console.log("📱 Current URL:", window.location.href);
    console.log("📱 Search params:", window.location.search);

    // Get from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const urlSession = urlParams.get("session");
    console.log("📱 URL session param:", urlSession);

    // Try hash-based parameters (some QR codes use #)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashSession = hashParams.get("session");
    console.log("📱 Hash session param:", hashSession);

    // First try to get from localStorage (mobile browsers sometimes lose URL params)
    const storedSession = localStorage.getItem("restaurant_session_code");
    console.log("📱 Stored session:", storedSession);

    // Priority: URL > Hash > Storage
    let finalSession = urlSession || hashSession || storedSession;

    // If we have a URL or hash session, store it and use it
    if (urlSession || hashSession) {
      const sessionToStore = urlSession || hashSession;
      localStorage.setItem("restaurant_session_code", sessionToStore!);
      console.log("📱 Session stored:", sessionToStore);
      return sessionToStore;
    }

    // If no URL session but we have stored session, use stored
    if (storedSession) {
      console.log("📱 Using stored session:", storedSession);
      return storedSession;
    }

    console.log("📱 No session found anywhere");
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
    console.log("📱 Getting table ID...");

    // Get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlTable = urlParams.get("table");
    console.log("📱 URL table param:", urlTable);

    // Try hash-based parameters
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashTable = hashParams.get("table");
    console.log("📱 Hash table param:", hashTable);

    // First try to get from localStorage
    const storedTable = localStorage.getItem("restaurant_table_id");
    console.log("📱 Stored table:", storedTable);

    // Priority: URL > Hash > Storage
    let finalTable = urlTable || hashTable || storedTable;

    // If we have a URL or hash table, store it and use it
    if (urlTable || hashTable) {
      const tableToStore = urlTable || hashTable;
      localStorage.setItem("restaurant_table_id", tableToStore!);
      console.log("📱 Table stored:", tableToStore);
      return tableToStore;
    }

    // If no URL table but we have stored table, use stored
    if (storedTable) {
      console.log("📱 Using stored table:", storedTable);
      return storedTable;
    }

    console.log("📱 No table found anywhere");
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

/**
 * Debug function to log all session-related information
 */
export const debugSessionInfo = (): void => {
  console.log("🔍 === SESSION DEBUG INFO ===");
  console.log("📱 User Agent:", navigator.userAgent);
  console.log("📱 Current URL:", window.location.href);
  console.log("📱 Search params:", window.location.search);
  console.log("📱 Hash:", window.location.hash);
  console.log(
    "📱 Stored session:",
    localStorage.getItem("restaurant_session_code")
  );
  console.log("📱 Stored table:", localStorage.getItem("restaurant_table_id"));
  console.log("📱 Environment URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log(
    "📱 Environment Key exists:",
    !!import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  console.log("🔍 === END DEBUG INFO ===");
};
