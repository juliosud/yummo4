import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  User,
  LogOut,
  ChefHat,
  ClipboardList,
  BarChart3,
  Settings,
  Calculator,
  Users,
  Plus,
  Trash2,
  QrCode,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import MenuView from "./MenuView";
import OrdersDashboard from "./OrdersDashboard";
import AIInsightsChat from "./AIInsightsChat";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTables } from "@/contexts/TableContext";


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

const TableManagement = () => {
  const {
    tables,
    loading,
    activeSessions,
    fetchTables,
    refreshTables,
    endSession,
    bulkEndAllTerminalSessions,
    checkActiveSessions,
  } = useTables();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Terminal troubleshooting helper
  const getTerminalInfo = (table: Table) => {
    if (table.table_type !== "terminal") return null;
    
    const sessionData = activeSessions[table.table_id];
    return {
      tableId: table.table_id,
      sessionActive: table.sessionActive,
      qrCodeUrl: sessionData?.menuUrl || "No active session",
      lastActivity: sessionData ? "Active" : "Inactive"
    };
  };

  const addTable = async (tableType: "regular" | "terminal" = "regular") => {
    try {
      // Get existing table IDs to find the next available number
      const existingTableIds = tables.map(t => t.table_id);
      
      // For terminals, find the next available terminal number
      let nextTableNumber: string;
      let nextName: string;
      
      if (tableType === "terminal") {
        let terminalCount = 1;
        while (existingTableIds.includes(`T-${terminalCount.toString().padStart(2, '0')}`)) {
          terminalCount++;
        }
        nextTableNumber = `T-${terminalCount.toString().padStart(2, '0')}`;
        nextName = `Terminal ${terminalCount}`;
      } else {
        // For regular tables, find the next available number
        let tableCount = 1;
        while (existingTableIds.includes(tableCount.toString())) {
          tableCount++;
        }
        nextTableNumber = tableCount.toString();
        nextName = `Table ${tableCount}`;
      }

      // Calculate position for new table based on current table count
      const tablesPerRow = 4;
      const spacing = 120;
      const padding = 40;
      const index = tables.length;

      const row = Math.floor(index / tablesPerRow);
      const col = index % tablesPerRow;

      const x = padding + col * spacing;
      const y = padding + row * spacing;

      const newTableData = {
        table_id: nextTableNumber,
        name: nextName,
        seats: tableType === "terminal" ? 1 : 4,
        status: "available" as const,
        table_type: tableType,
        canvas_x: x,
        canvas_y: y,
      };

      // Check if Supabase is configured
      if (
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        console.log("Supabase not configured, adding mock table");
        const newTable: Table = {
          id: Date.now().toString(),
          table_id: nextTableNumber,
          name: newTableData.name,
          seats: newTableData.seats,
          status: newTableData.status,
          table_type: newTableData.table_type,
          x: x,
          y: y,
          sessionActive: false,
        };
        // Refresh tables from context
        await refreshTables();
        return;
      }

      const { data, error } = await supabase
        .from("tables")
        .insert(newTableData)
        .select()
        .single();

      if (error) {
        console.error("Error adding table:", error);
        return;
      }

      const newTable: Table = {
        id: data.id,
        table_id: data.table_id,
        name: data.name,
        seats: data.seats,
        status: data.status,
        table_type: data.table_type || "regular",
        x: data.canvas_x,
        y: data.canvas_y,
        sessionActive: false,
      };

      // Refresh tables from context
      await refreshTables();
      console.log("✅ Table added successfully:", newTable.name);
    } catch (error) {
      console.error("Error adding table:", error);
    }
  };

  const deleteTable = async (id: string) => {
    try {
      const tableToDelete = tables.find(t => t.id === id);
      if (!tableToDelete) return;

      // Check if Supabase is configured
      if (
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        console.log("Supabase not configured, removing mock table");
        // Refresh tables from context
        await refreshTables();
        return;
      }

      // If it's a terminal with an active session, end it first
      if (tableToDelete.table_type === "terminal" && tableToDelete.sessionActive) {
        await endSession(id);
      }

      const { error } = await supabase.from("tables").delete().eq("id", id);

      if (error) {
        console.error("Error deleting table:", error);
        return;
      }

      // Refresh tables from context
      await refreshTables();
      console.log("✅ Table deleted successfully");
    } catch (error) {
      console.error("Error deleting table:", error);
    }
  };

  const startSession = async (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    try {
      if (table.table_type === "terminal") {
        // Build a static URL for the terminal. Each scan will create a new session.
        const baseUrl = window.location.origin;
        const basePath = import.meta.env.VITE_BASE_PATH || "";
        const terminalUrl = new URL(
          `${basePath ? `${basePath}` : ""}/term/${table.table_id}`,
          baseUrl
        ).toString();

        // Generate a QR for the static terminal URL
        const qrCodeDataUrl = await QRCode.toDataURL(terminalUrl, {
          width: 256,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        });

        // Update local state for display
        const updatedTable = { ...table, qrCode: qrCodeDataUrl, menuUrl: terminalUrl, sessionActive: true };
        setSelectedTable(updatedTable);
        setShowQRDialog(true);
        return; // IMPORTANT: exit here for terminals (no per-scan session on the admin side)
      }

      // Generate unique session code for regular tables
      const sessionCode = `${table.table_id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Generate the menu URL with proper base path handling
      const baseUrl = window.location.origin;
      const basePath = import.meta.env.VITE_BASE_PATH || "";
      const menuPath = basePath ? `${basePath}/menu` : "/menu";
      const menuUrl = `${baseUrl}${menuPath}?table=${table.table_id}&session=${sessionCode}`;

      console.log("🔗 Generated session URL:", menuUrl);
      console.log("🔗 Base URL:", baseUrl);
      console.log("🔗 Base Path:", basePath);
      console.log("🔗 Menu Path:", menuPath);
      console.log("🔗 Current location:", window.location.href);
      console.log(
        "🔗 Environment:",
        import.meta.env.DEV ? "development" : "production",
      );

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Save session to database if Supabase is configured
      if (
        import.meta.env.VITE_SUPABASE_URL &&
        import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        console.log("🔄 Starting session for table:", table.table_id);
        const { data, error } = await supabase
          .from("table_sessions")
          .insert({
            table_id: table.table_id, // Use table_id instead of id
            session_code: sessionCode,
            is_active: true,
            qr_code_data: qrCodeDataUrl,
            menu_url: menuUrl,
          })
          .select()
          .single();

        if (error) {
          console.error("❌ Failed to save session to database:", error);
          alert(`Failed to start session: ${error.message}`);
          return;
        } else {
          console.log("✅ Session saved to database:", data);
        }
      }

      // Refresh tables to update the UI state
      await refreshTables();

      // Show QR code dialog
      const updatedTable = {
        ...table,
        qrCode: qrCodeDataUrl,
        menuUrl: menuUrl,
      };
      setSelectedTable(updatedTable);
      setShowQRDialog(true);
    } catch (error) {
      console.error("❌ Failed to generate QR code:", error);
      alert(`Failed to start session: ${error}`);
    }
  };

  const handleEndSession = async (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    try {
      // End all active sessions for this table in database if Supabase is configured
      if (
        import.meta.env.VITE_SUPABASE_URL &&
        import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        console.log("🔄 Ending session for table:", table.table_id);

        // For terminals, we want to end ALL sessions (active and inactive) to prevent new ones
        // For regular tables, we only end active sessions
        if (table.table_type === "terminal") {
          // End all sessions for this terminal and mark it as permanently ended
          const { data, error } = await supabase
            .from("table_sessions")
            .update({
              is_active: false,
              ended_at: new Date().toISOString(),
            })
            .eq("table_id", table.table_id)
            .select();

          if (error) {
            console.error(
              "❌ Failed to end terminal sessions in database:",
              error,
            );
            alert(`Failed to end terminal session: ${error.message}`);
            return;
          } else {
            console.log(
              "✅ All terminal sessions ended in database for table:",
              table.table_id,
              "Updated records:",
              data?.length || 0,
            );
          }
        } else {
          // For regular tables, only end active sessions
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
            alert(`Failed to end session: ${error.message}`);
            return;
          } else {
            console.log(
              "✅ Session ended in database for table:",
              table.table_id,
              "Updated records:",
              data?.length || 0,
            );
          }
        }
      }

      // Call the context function to end the session
      await endSession(tableId);
    } catch (error) {
      console.error("❌ Failed to end session:", error);
      alert(`Failed to end session: ${error}`);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const showQRCode = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (table && table.sessionActive) {
      const sessionData = activeSessions[table.table_id];
      if (sessionData) {
        const updatedTable = {
          ...table,
          qrCode: sessionData.qrCode,
          menuUrl: sessionData.menuUrl,
        };
        setSelectedTable(updatedTable);
        setShowQRDialog(true);
      }
    }
  };

  // Load tables on component mount
  useEffect(() => {
    fetchTables();
  }, []);

  const getStatusColor = (
    sessionActive: boolean,
    tableType: "regular" | "terminal",
  ) => {
    if (sessionActive) {
      return "bg-blue-50 border-blue-400 text-blue-700 border-2";
    }
    if (tableType === "terminal") {
      return "bg-purple-50 border-purple-200 text-purple-700";
    }
    return "bg-gray-50 border-gray-200 text-gray-700";
  };

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold">Table Management</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your restaurant tables and their availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => addTable("regular")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
          <Button
            onClick={() => addTable("terminal")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Add Terminal
          </Button>
        </div>
      </div>

      <div
        data-canvas="table-layout"
        className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg"
        style={{ height: "550px", width: "100%" }}
      >
        <div className="absolute inset-2 text-xs text-gray-400 pointer-events-none">
          Restaurant Floor Plan - Tables are automatically arranged
        </div>
        {tables.map((table) => (
          <div
            key={table.id}
            className="absolute select-none cursor-default"
            style={{
              left: table.x,
              top: table.y,
            }}
          >
            <div
              className={cn(
                "relative w-20 h-20 border-2 rounded-xl flex flex-col items-center justify-center transition-all shadow-md hover:scale-105",
                getStatusColor(table.sessionActive, table.table_type),
                table.table_type === "terminal" && "ring-2 ring-purple-200"
              )}
            >
              <button
                onClick={() => deleteTable(table.id)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <Trash2 className="h-3 w-3 text-white" />
              </button>

              {/* Table/Terminal representation */}
              <div 
                className="w-12 h-6 bg-white/50 rounded-md border border-current mb-1 flex items-center justify-center"
                title={table.table_type === "terminal" ? "Self-service terminal" : `${table.seats} seats`}
              >
                {table.table_type === "terminal" ? (
                  <QrCode className="h-3 w-3" />
                ) : (
                  <div className="text-xs font-bold">{table.seats}</div>
                )}
              </div>

              <div className="text-center mb-1">
                <div className="text-xs font-semibold">{table.name}</div>
              </div>

              {/* Session Control Buttons */}
              <div className="flex gap-1">
                {!table.sessionActive ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startSession(table.id);
                    }}
                    className="px-1 py-0.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                  >
                    Start
                  </button>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showQRCode(table.id);
                      }}
                      className="px-1 py-0.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-1"
                      title="Show QR Code"
                    >
                      <QrCode className="h-2 w-2" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        endSession(table.id);
                      }}
                      className="px-1 py-0.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                    >
                      End
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading tables...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No tables yet
          </h4>
          <p className="text-gray-500 mb-4">
            Add your first table to get started with table management.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => addTable("regular")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Table
            </Button>
            <Button onClick={() => addTable("terminal")} variant="outline">
              <QrCode className="h-4 w-4 mr-2" />
              Add Terminal
            </Button>
          </div>
        </div>
      ) : null}

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[90vh] overflow-hidden p-0 gap-0">
          <DialogHeader className="p-3 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center justify-center gap-2 text-base">
              <QrCode className="h-4 w-4" />
              QR Code for {selectedTable?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="px-3 pb-3 flex flex-col min-h-0 overflow-y-auto">
            {selectedTable?.qrCode && (
              <div className="flex justify-center mb-3 flex-shrink-0">
                <div className="bg-white p-2 rounded-lg border border-gray-200 inline-block">
                  <img
                    src={selectedTable.qrCode}
                    alt={`QR Code for ${selectedTable.name}`}
                    className="w-32 h-32 sm:w-40 sm:h-40 block"
                  />
                </div>
              </div>
            )}
            <div className="text-center space-y-2 mb-3 flex-shrink-0">
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                Customers can scan this QR code to access the menu for{" "}
                {selectedTable?.name}
              </p>
              {selectedTable?.menuUrl && (
                <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg border text-left">
                  <code className="text-xs flex-1 truncate min-w-0">
                    {selectedTable.menuUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedTable.menuUrl!)}
                    className="h-5 w-5 p-0 flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowQRDialog(false)}
                className="flex-1 h-8 text-xs"
              >
                Close
              </Button>
              {selectedTable?.qrCode && (
                <Button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.download = `qr-code-${selectedTable.name.toLowerCase().replace(/\s+/g, "-")}.png`;
                    link.href = selectedTable.qrCode;
                    link.click();
                  }}
                  className="flex-1 h-8 text-xs"
                >
                  Download QR
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Home = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, profile, signOut } = useAuth();
  const {
    tables,
    refreshTables,
  } = useTables();

  // Handle logout with proper authentication
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await signOut();

      if (error) {
        console.error("Logout error:", error);
        // Still redirect even if there's an error to ensure user is logged out
      }

      // Redirect to landing page after logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback redirect
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
    },
    {
      id: "menu",
      label: "Menu",
      icon: ChefHat,
    },
    {
      id: "orders",
      label: "Orders",
      icon: ClipboardList,
    },
    {
      id: "table",
      label: "Table",
      icon: Users,
    },
    {
      id: "accounting",
      label: "Accounting",
      icon: Calculator,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  // This component should only render when user is authenticated
  // The App.tsx handles redirecting unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full space-y-6 p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Loading...</h1>
            <p className="text-muted-foreground mt-2">
              Please wait while we load your dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Navigation - Bottom Tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                  activeTab === item.id
                    ? "bg-yellow-100 text-yellow-800"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <span className="font-bold text-xl">yummo.ai</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      activeTab === item.id
                        ? "bg-yellow-100 text-yellow-800 font-medium"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium block truncate">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.email || user?.email || "User"}
              </span>
              {profile?.restaurant_name && (
                <span className="text-xs text-gray-500 block truncate">
                  {profile.restaurant_name}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 pt-safe-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold capitalize">{activeTab}</h1>
                <p className="text-xs text-gray-500">
                  {profile?.restaurant_name || "Restaurant"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-gray-600 hover:text-red-600"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        {/* Desktop Header */}
        <header
          className="hidden lg:block bg-white border-b border-gray-200 px-6"
          style={{ height: "77px" }}
        >
          <div className="flex items-center justify-between h-full">
            <div>
              <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-3 lg:p-6 bg-gray-50 pb-20 lg:pb-6">
          {activeTab === "orders" && <OrdersDashboard />}

          {activeTab === "menu" && (
            <div>
              <MenuView onAddToCart={() => {}} />
            </div>
          )}

                     {activeTab === "dashboard" && (
             <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:h-full">

              {/* Mobile Stats Grid */}
              <div className="lg:hidden">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white p-3 rounded-2xl border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Orders Today
                        </p>
                        <p className="text-lg font-bold">24</p>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <ClipboardList className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      +12%
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Revenue
                        </p>
                        <p className="text-lg font-bold">$1,247</p>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      +8%
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Active Orders
                        </p>
                        <p className="text-lg font-bold">7</p>
                      </div>
                      <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <ChefHat className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <p className="text-xs text-orange-600 mt-1 font-medium">
                      3 ready, 4 prep
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Avg. Prep Time
                        </p>
                        <p className="text-lg font-bold">18m</p>
                      </div>
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Search className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      -2m
                    </p>
                  </div>
                </div>
              </div>

              {/* Main AI Chat Feature */}
              <div className="lg:col-span-2 h-full">
                <div className="h-full min-h-[500px] lg:min-h-[700px]">
                  <AIInsightsChat />
                </div>
              </div>

                             {/* Desktop Side Panel with Stats and Activity */}
               <div className="hidden lg:block space-y-6">

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Orders Today
                        </p>
                        <p className="text-xl font-bold">24</p>
                      </div>
                      <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <ClipboardList className="h-3 w-3 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      +12% from yesterday
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Revenue
                        </p>
                        <p className="text-xl font-bold">$1,247</p>
                      </div>
                      <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-3 w-3 text-green-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      +8% from yesterday
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Active Orders
                        </p>
                        <p className="text-xl font-bold">7</p>
                      </div>
                      <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <ChefHat className="h-3 w-3 text-orange-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      3 ready, 4 in progress
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Avg. Prep Time
                        </p>
                        <p className="text-xl font-bold">18m</p>
                      </div>
                      <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <Search className="h-3 w-3 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      -2m from yesterday
                    </p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h4 className="text-sm font-semibold mb-3">
                    Recent Activity
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <div>
                        <p className="text-xs font-medium">
                          Order #325 completed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Table A4 - Ariel Hikmat
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        2m ago
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <div>
                        <p className="text-xs font-medium">
                          New order received
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Table B2 - Denis Freeman
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        5m ago
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-medium">Menu item updated</p>
                        <p className="text-xs text-muted-foreground">
                          Chocolate Cake - Price changed
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        12m ago
                      </span>
                    </div>
                  </div>
                </div>

                {/* Popular Items */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h4 className="text-sm font-semibold mb-3">
                    Popular Items Today
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-xs">
                          1
                        </div>
                        <div>
                          <p className="text-xs font-medium">Belgian Waffles</p>
                          <p className="text-xs text-muted-foreground">
                            8 orders
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium">$103.92</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-medium text-xs">
                          2
                        </div>
                        <div>
                          <p className="text-xs font-medium">
                            Meat & Mushrooms
                          </p>
                          <p className="text-xs text-muted-foreground">
                            6 orders
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium">$222.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-medium text-xs">
                          3
                        </div>
                        <div>
                          <p className="text-xs font-medium">Shrimp Salad</p>
                          <p className="text-xs text-muted-foreground">
                            5 orders
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium">$112.50</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "table" && <TableManagement />}

          {activeTab === "accounting" && (
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Accounting</h3>
              <p className="text-muted-foreground">
                Accounting features coming soon...
              </p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Settings</h3>
              <p className="text-muted-foreground">
                Settings panel coming soon...
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;
