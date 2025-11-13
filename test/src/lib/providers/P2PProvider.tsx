import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "@/lib/store/hooks";
import { useSignaling, useConnectionManager } from "@/lib/hooks";

import { Button } from "@/components/ui/button";

import { Loader2, RefreshCw, Home } from "lucide-react";

export function P2PProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { pathname } = useLocation();
  const { currentUser } = useAppSelector((state) => state.user);
  const { isConnected: signalingConnected, signaling, hasError, retry, reset } = useSignaling();
  const { connectionManager } = useConnectionManager();

  const needsP2P = pathname.startsWith("/chat");
  const p2pReady = signalingConnected && !!connectionManager;
  console.log(signaling?.connectionState)

  const statusText =
    hasError
      ? "Failed to connect to signaling server."
      : !signalingConnected
        ? "Setting up signaling client..."
        : !connectionManager
          ? "Setting up P2P connections..."
          : "Preparing chat...";

  if (needsP2P && currentUser && !p2pReady)
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="text-primary size-8 animate-spin" />
          <div className="text-muted-foreground text-sm font-medium">
            {statusText}
          </div>

          {hasError && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={retry}
                className="inline-flex items-center space-x-2"
              >
                <RefreshCw className="size-4" />
                <span>Retry Connection</span>
              </Button>
              <Button
                onClick={reset}
                variant="outline"
                className="inline-flex items-center space-x-2"
              >
                <Home className="size-4" />
                <span>Return to Home</span>
              </Button>
            </div>
          )}

          {import.meta.env.DEV && (
            <div className="mt-2 text-center text-xs text-gray-500">
              <div>
                Signaling Connection State: {signaling?.connectionState ?? "Initlizing"}
              </div>
              <div>
                Connected to Signaling Server: {signalingConnected ? "Yes" : "No"}
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
