import React from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Users, Table as TableIcon } from "lucide-react";
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

interface DashboardOverviewProps {
  tables: Table[];
  onRefreshTables: () => void;
  onEndAllTerminalSessions: () => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tables,
  onRefreshTables,
  onEndAllTerminalSessions,
}) => {
  // Get terminal statistics
  const getTerminalStats = () => {
    const terminals = tables.filter(t => t.table_type === "terminal");
    const activeTerminals = terminals.filter(t => t.sessionActive);
    const inactiveTerminals = terminals.filter(t => !t.sessionActive);
    
    return {
      total: terminals.length,
      active: activeTerminals.length,
      inactive: inactiveTerminals.length,
      terminals
    };
  };

  // Get table statistics
  const getTableStats = () => {
    const regularTables = tables.filter(t => t.table_type === "regular");
    const activeTables = regularTables.filter(t => t.sessionActive);
    const inactiveTables = regularTables.filter(t => !t.sessionActive);
    const totalSeats = regularTables.reduce((sum, table) => sum + table.seats, 0);
    
    return {
      total: regularTables.length,
      active: activeTables.length,
      inactive: inactiveTables.length,
      totalSeats,
      tables: regularTables
    };
  };

  const terminalStats = getTerminalStats();
  const tableStats = getTableStats();

  return (
    <div className="space-y-6">
      {/* Terminal Overview */}
      {terminalStats.total > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Terminal Overview
            </h4>
            {terminalStats.active > 0 && (
              <Button
                onClick={onEndAllTerminalSessions}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                End All Sessions
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{terminalStats.total}</div>
              <div className="text-sm text-purple-700">Total Terminals</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-green-600">{terminalStats.active}</div>
              <div className="text-sm text-green-700">Active Sessions</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-gray-600">{terminalStats.inactive}</div>
              <div className="text-sm text-gray-700">Available</div>
            </div>
          </div>
        </div>
      )}

      {/* Table Overview */}
      {tableStats.total > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              Table Overview
            </h4>
            <Button
              onClick={onRefreshTables}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Refresh Tables
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{tableStats.total}</div>
              <div className="text-sm text-blue-700">Total Tables</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-green-600">{tableStats.active}</div>
              <div className="text-sm text-green-700">Active Sessions</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-gray-600">{tableStats.inactive}</div>
              <div className="text-sm text-gray-700">Available</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-indigo-600">{tableStats.totalSeats}</div>
              <div className="text-sm text-indigo-700">Total Seats</div>
            </div>
          </div>
        </div>
      )}

      {/* Combined Summary */}
      {(terminalStats.total > 0 || tableStats.total > 0) && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Restaurant Overview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{terminalStats.total + tableStats.total}</div>
              <div className="text-sm text-gray-700">Total Locations</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{terminalStats.active + tableStats.active}</div>
              <div className="text-sm text-green-700">Active Sessions</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{tableStats.totalSeats}</div>
              <div className="text-sm text-blue-700">Total Capacity</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
