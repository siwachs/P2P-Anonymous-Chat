"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";
import { useSignaling, useConnectionManager } from "@/lib/hooks";

import { Loader2 } from "lucide-react";

export function P2PProvider({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { currentUser } = useAppSelector((state) => state.user);
  const { isConnected } = useSignaling();
  const { connectionManager } = useConnectionManager();

  const needsP2P = pathname.startsWith("/chat");
  const p2pRead = isConnected && connectionManager;

  const getLoadingMessage = () => {
    if (!isConnected) return "Connecting to signaling server...";
    if (!connectionManager) return "Setting up P2P connections...";
    return "Preparing chat...";
  };

  if (needsP2P && currentUser && !p2pRead)
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="text-primary size-8 animate-spin" />
          <div className="text-muted-foreground text-sm font-medium">
            {getLoadingMessage()}
          </div>
        </div>
      </div>
    );

  return <>{children}</>;
}
