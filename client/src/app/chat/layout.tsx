"use client";

import { ReactNode } from "react";
import { useUserPersistence } from "@/lib/hooks/useUserPersistence";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useUserPersistence();

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          Checking user info...
        </div>
      </div>
    );

  return <>{children}</>;
}
