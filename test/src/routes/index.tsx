import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PublicRoute, ProtectedRoute } from "./route-guards";

import { RootLayout } from "@/layouts";
import RouteError from "@/components/RouteError";

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
          element: (
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="text-muted-foreground mt-2">Page not found</p>
              </div>
            </div>
          ),
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
