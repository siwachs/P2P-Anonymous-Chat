import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PublicRoute, ProtectedRoute } from "./route-guards";

import publicRoutes from "./public-routes";
import protectedRoutes from "./protected-routes";

export default function AppRouter() {
  const router = createBrowserRouter([
    {
      element: <PublicRoute />,
      children: publicRoutes,
    },
    {
      element: <ProtectedRoute />,
      children: protectedRoutes,
    },
    {
      path: "*",
      element: <h1>Not Found</h1>,
    },
  ]);

  return <RouterProvider router={router} />;
}
