import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "@/lib/store/hooks";
import { useSignalingSession, useConnectionManager } from "@/lib/p2p/hooks";
import { P2PContext } from "@/lib/p2p/P2PContext";

import { Button } from "@/components/ui/button";

import { Loader2, RefreshCw, Home } from "lucide-react";

export function P2PProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { pathname } = useLocation();
  const { currentUser } = useAppSelector((state) => state.user);
  const { signalingConnected, signaling, reset, retry, signalingHasError } =
    useSignalingSession();
  const { connectionManager } = useConnectionManager(
    signaling,
    signalingConnected
  );

  const needsP2P = pathname.startsWith("/chat");
  const p2pReady = signalingConnected && !!connectionManager;
  const isLoadingP2P = needsP2P && currentUser && !p2pReady;

  const statusText = (() => {
    if (signalingHasError) return "Failed to connect to signaling server.";
    if (!signalingConnected) return "Setting up signaling client...";
    if (!connectionManager) return "Setting up P2P connections...";
    return "Preparing chat...";
  })();

  const ctxValue = { logout: reset };

  if (isLoadingP2P)
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="text-primary size-8 animate-spin" />
          <div className="text-muted-foreground text-sm font-medium">
            {statusText}
          </div>

          {signalingHasError && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={retry}
                className="inline-flex items-center space-x-2"
              >
                <RefreshCw className="size-4" />
                <span>Retry Now</span>
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
                Signaling Connection State:{" "}
                {signaling?.connectionState ?? "Initlizing"}
              </div>
              <div>
                Connected to Signaling Server:{" "}
                {signalingConnected ? "Yes" : "No"}
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

  return <P2PContext value={ctxValue}>{children}</P2PContext>;
}
