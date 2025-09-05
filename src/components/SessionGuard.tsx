import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  checkSessionActive,
  getSessionCodeFromUrl,
  getTableIdFromUrl,
  clearSessionData,
  debugSessionInfo,
} from "@/lib/session-utils";

interface SessionGuardProps {
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

const SessionGuard: React.FC<SessionGuardProps> = ({
  children,
  fallbackComponent,
}) => {
  const [isSessionActive, setIsSessionActive] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const checkSession = async (isRetry = false) => {
    if (!isRetry) {
      setIsLoading(true);
      setLastError(null);
    }

    try {
      console.log("🔍 SessionGuard: Starting session check...");
      debugSessionInfo(); // Log all debug info

      const urlSessionCode = getSessionCodeFromUrl();
      const urlTableId = getTableIdFromUrl();

      console.log("🔍 SessionGuard: Got session code:", urlSessionCode);
      console.log("🔍 SessionGuard: Got table ID:", urlTableId);

      setSessionCode(urlSessionCode);
      setTableId(urlTableId);

      if (!urlSessionCode) {
        console.log("❌ No session code found in URL or storage");
        setIsSessionActive(false);
        setIsLoading(false);
        return;
      }

      console.log("📱 Checking session:", urlSessionCode);
      const isActive = await checkSessionActive(urlSessionCode);
      console.log("🔍 SessionGuard: Session active result:", isActive);

      setIsSessionActive(isActive);
      setRetryCount(0); // Reset retry count on success
      setLastError(null);
    } catch (error) {
      console.error("❌ Session check failed:", error);
      setLastError(error instanceof Error ? error.message : "Unknown error");
      setIsSessionActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    console.log("🔄 SessionGuard: Manual retry triggered");
    setRetryCount((prev) => prev + 1);
    await checkSession(true);
  };

  const handleClearSession = () => {
    console.log("🗑️ SessionGuard: Clearing session data");
    clearSessionData();
    setSessionCode(null);
    setTableId(null);
    setIsSessionActive(false);
    // Reload page to start fresh
    window.location.reload();
  };

  const handleDebugLog = () => {
    debugSessionInfo();
    console.log("🔍 Current component state:", {
      isSessionActive,
      isLoading,
      sessionCode,
      tableId,
      retryCount,
      lastError,
    });
  };

  useEffect(() => {
    console.log("🔍 SessionGuard: Component mounted, starting initial check");
    checkSession();

    // Check session status every 30 seconds, but less frequently on mobile to save battery
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    console.log("📱 Device detected as mobile:", isMobile);
    const interval = setInterval(checkSession, isMobile ? 60000 : 30000); // 60s on mobile, 30s on desktop

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Checking Session
            </h2>
            <p className="text-gray-600 text-center">
              Please wait while we verify your table session...
            </p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Retry attempt {retryCount}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSessionActive) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Session Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {!sessionCode
                ? "No valid session found. Please scan the QR code at your table to access the menu."
                : "Your table session has ended or there's a connection issue. Please try refreshing or ask restaurant staff for help."}
            </p>

            {lastError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">Error: {lastError}</p>
              </div>
            )}

            {tableId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Table:</strong> {tableId}
                </p>
                {sessionCode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Session: {sessionCode.slice(-8)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {sessionCode && retryCount < 3 && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              )}

              <Button
                onClick={handleClearSession}
                variant="outline"
                className="w-full"
              >
                Clear Session & Restart
              </Button>

              <Button
                onClick={handleDebugLog}
                variant="ghost"
                className="w-full text-xs"
              >
                Show Debug Info (Check Console)
              </Button>
            </div>

            <div className="text-xs text-gray-500 mt-4 space-y-1">
              <p>
                Need help? Ask your server to start a new session for your
                table.
              </p>
              <p className="text-xs">
                📱 Mobile tip: Keep this tab open to maintain your session.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default SessionGuard;
