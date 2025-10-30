import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "@/lib/store/hooks";
import { useSignaling, useConnectionManager } from "@/lib/hooks";

import { Loader2 } from "lucide-react";

export function P2PProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { pathname } = useLocation();
  const { currentUser } = useAppSelector((state) => state.user);
  const { isConnected, signaling } = useSignaling();
  const { connectionManager } = useConnectionManager();

  const needsP2P = pathname.startsWith("/chat");
  const p2pReady = !!(isConnected && connectionManager);

  const getLoadingMessage = () => {
    if (!isConnected) return "Setting up signaling client...";
    if (!connectionManager) return "Setting up P2P connections...";
    return "Preparing chat...";
  };

  if (needsP2P && currentUser && !p2pReady)
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="text-primary size-8 animate-spin" />
          <div className="text-muted-foreground text-sm font-medium">
            {getLoadingMessage()}
          </div>

          {import.meta.env.DEV && (
            <div className="mt-2 text-center text-xs text-gray-500">
              <div>
                Signaling Connection State: {signaling?.connectionState}
              </div>
              <div>
                Connected to Signaling Server: {isConnected ? "Yes" : "No"}
              </div>
              <div>
                Connection Manager is:{" "}
                {connectionManager ? "Ready" : "Not ready"}
              </div>
            </div>
          )}
        </div>
      </div>
    );

  return <>{children}</>;
}
