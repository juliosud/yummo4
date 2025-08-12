import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface Table {
  id: string;
  table_id: string;
  name: string;
  seats: number;
  status: "available" | "occupied" | "reserved";
  table_type: "regular" | "terminal";
  x: number;
  y: number;
  sessionActive: boolean;
  qrCode?: string;
  menuUrl?: string;
}

interface TableContextType {
  tables: Table[];
  loading: boolean;
  activeSessions: Record<string, { qrCode: string; menuUrl: string }>;
  fetchTables: () => Promise<void>;
  refreshTables: () => Promise<void>;
  endSession: (tableId: string) => Promise<void>;
  bulkEndAllTerminalSessions: () => Promise<void>;
  checkActiveSessions: (tablesToCheck: Table[]) => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const useTables = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error("useTables must be used within a TableProvider");
  }
  return context;
};

interface TableProviderProps {
  children: ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState<
    Record<string, { qrCode: string; menuUrl: string }>
  >({});

  // Fetch tables from database
  const fetchTables = async () => {
    try {
      setLoading(true);

      // Check if Supabase is configured
      if (
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        console.log(
          "🏪 TableContext: Using mock tables (database not connected)",
        );
        // Use mock data when Supabase is not configured with automatic positioning
        const mockTablesData = [
          {
            id: "1",
            table_id: "1",
            name: "Table 1",
            seats: 4,
            status: "available" as const,
            table_type: "regular" as const,
          },
          {
            id: "2",
            table_id: "2",
            name: "Table 2",
            seats: 2,
            status: "available" as const,
            table_type: "regular" as const,
          },
          {
            id: "3",
            table_id: "3",
            name: "Table 3",
            seats: 6,
            status: "available" as const,
            table_type: "regular" as const,
          },
        ];

        const mockTables: Table[] = mockTablesData.map((table, index) => {
          const tablesPerRow = 4;
          const spacing = 120;
          const padding = 40;

          const row = Math.floor(index / tablesPerRow);
          const col = index % tablesPerRow;

          const x = padding + col * spacing;
          const y = padding + row * spacing;

          return {
            ...table,
            x,
            y,
            sessionActive: false,
          };
        });
        setTables(mockTables);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching tables:", error);
        setTables([]);
        return;
      }

      if (data && data.length > 0) {
        const tablesWithPositioning = data.map((table, index) => {
          const tablesPerRow = 4;
          const spacing = 120;
          const padding = 40;

          const row = Math.floor(index / tablesPerRow);
          const col = index % tablesPerRow;

          const x = padding + col * spacing;
          const y = padding + row * spacing;

          return {
            ...table,
            x,
            y,
            sessionActive: false,
          };
        });

        setTables(tablesWithPositioning);
        
        // Check for active sessions after setting tables
        await checkActiveSessions(tablesWithPositioning);
      } else {
        setTables([]);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh tables (alias for fetchTables)
  const refreshTables = async () => {
    await fetchTables();
  };

  // End a session for a specific table
  const endSession = async (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    try {
      // End all active sessions for this table in database if Supabase is configured
      if (
        import.meta.env.VITE_SUPABASE_URL &&
        import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        console.log("🔄 Ending session for table:", table.table_id);
        const { data, error } = await supabase
          .from("table_sessions")
          .update({
            is_active: false,
            ended_at: new Date().toISOString(),
          })
          .eq("table_id", table.table_id)
          .eq("is_active", true)
          .select();

        if (error) {
          console.error("❌ Failed to end session in database:", error);
          throw new Error(`Failed to end session: ${error.message}`);
        } else {
          console.log(
            "✅ Session ended in database for table:",
            table.table_id,
            "Updated records:",
            data?.length || 0,
          );
        }
      }

      // Remove from active sessions
      setActiveSessions((prev) => {
        const updated = { ...prev };
        delete updated[table.table_id];
        return updated;
      });

      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                sessionActive: false,
              }
            : t,
        ),
      );
    } catch (error) {
      console.error("❌ Failed to end session:", error);
      throw error;
    }
  };

  // Bulk terminal management
  const bulkEndAllTerminalSessions = async () => {
    try {
      const activeTerminals = tables.filter(t => 
        t.table_type === "terminal" && t.sessionActive
      );
      
      if (activeTerminals.length === 0) {
        alert("No active terminal sessions to end");
        return;
      }

      const confirmed = confirm(
        `Are you sure you want to end all ${activeTerminals.length} active terminal sessions?`
      );
      
      if (!confirmed) return;

      for (const terminal of activeTerminals) {
        await endSession(terminal.id);
      }
      
      alert(`Successfully ended ${activeTerminals.length} terminal sessions`);
    } catch (error) {
      console.error("Error ending all terminal sessions:", error);
      alert("Failed to end all terminal sessions");
    }
  };

  // Check for active sessions
  const checkActiveSessions = async (tablesToCheck: Table[]) => {
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      return;
    }

    try {
      const { data: sessions, error } = await supabase
        .from("table_sessions")
        .select("*")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching active sessions:", error);
        return;
      }

      const sessionMap: Record<string, { qrCode: string; menuUrl: string }> = {};
      const updatedTables = tablesToCheck.map((table) => {
        const activeSession = sessions?.find(
          (s) => s.table_id === table.table_id,
        );
        if (activeSession) {
          sessionMap[table.table_id] = {
            qrCode: activeSession.qr_code_data || "",
            menuUrl: activeSession.menu_url || "",
          };
          return { ...table, sessionActive: true };
        }
        return table;
      });

      setActiveSessions(sessionMap);
      setTables(updatedTables);
    } catch (error) {
      console.error("Error checking active sessions:", error);
    }
  };

  // Load tables on component mount
  useEffect(() => {
    fetchTables();
  }, []);

  const value: TableContextType = {
    tables,
    loading,
    activeSessions,
    fetchTables,
    refreshTables,
    endSession,
    bulkEndAllTerminalSessions,
    checkActiveSessions,
  };

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  );
};
