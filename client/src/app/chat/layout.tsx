"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserPersistence } from "@/lib/hooks/useUserPersistence";

import { ConnectionProvider } from "@/lib/providers/ConnectionProvider";

export default function ChatLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { isLoading, currentUser } = useUserPersistence();

  useEffect(() => {
    if (!isLoading && !currentUser) router.replace("/");
  }, [isLoading, currentUser, router]);

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          Checking user info...
        </div>
      </div>
    );

  return <ConnectionProvider>{children}</ConnectionProvider>;
}
