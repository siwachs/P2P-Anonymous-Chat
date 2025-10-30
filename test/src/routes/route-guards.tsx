import { Navigate, Outlet } from "react-router-dom";
import { useUserPersistence } from "@/lib/hooks";

import { Loader2 } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="text-primary size-8 animate-spin" />
        <div className="text-muted-foreground text-sm font-medium">
          Loading user data...
        </div>
      </div>
    </div>
  );
}

export function PublicRoute() {
  const { isLoading, currentUser } = useUserPersistence();

  if (isLoading) return <LoadingScreen />;
  if (currentUser) return <Navigate to="/chat" replace />;

  return <Outlet />;
}

export function ProtectedRoute() {
  const { isLoading, currentUser } = useUserPersistence();

  if (isLoading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/" replace />;

  return <Outlet />;
}
