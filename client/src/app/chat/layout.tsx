"use client";

import { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserPersistence } from "@/lib/hooks/useUserPersistence";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const currentUser = useUserPersistence();

  // useEffect(() => {
  //   if (!currentUser) router.replace("/");
  // }, [currentUser, router]);

  if (!currentUser)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          Checking user info...
        </div>
      </div>
    );

  return <>{children}</>;
}
