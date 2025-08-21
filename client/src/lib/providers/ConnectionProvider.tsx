"use client";

import { ReactNode, useEffect } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { useSignaling, useConnectionManager } from "@/lib/hooks";

export function ConnectionProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { currentUser } = useAppSelector((state) => state.user);
  const { isConnected } = useSignaling();
  const { connectionManager } = useConnectionManager();

  useEffect(() => {
    if (currentUser && isConnected && connectionManager) {
      console.log("P2P system ready:", {
        user: currentUser.username,
        signalingConnected: isConnected,
        connectionManagerReady: !!connectionManager,
      });
    }
  }, [currentUser, isConnected, connectionManager]);

  return <>{children}</>;
}
