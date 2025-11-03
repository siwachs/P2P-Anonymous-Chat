import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PublicRoute, ProtectedRoute } from "./route-guards";

import { RootLayout } from "@/layouts";
import { RouteError, NotFoundUI } from "@/components/error";

import publicRoutes from "./public-routes";
import protectedRoutes from "./protected-routes";

export default function AppRouter() {
  const router = createBrowserRouter([
    {
      element: <RootLayout />,
      errorElement: <RouteError />,
      children: [
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
          element: <NotFoundUI />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
