import { Navigate, Outlet } from "react-router-dom";
import { useUserPersistence } from "@/lib/hooks";

export function PublicRoute() {
  const { isLoading, currentUser } = useUserPersistence();

  if (isLoading) return <div>Loading...</div>;
  if (currentUser) return <Navigate to="/chat" replace />;

  return <Outlet />;
}

export function ProtectedRoute() {
  const { isLoading, currentUser } = useUserPersistence();

  if (isLoading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/" replace />;

  return <Outlet />;
}
