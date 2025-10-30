import type { RouteObject } from "react-router-dom";

import PublicLayout from "@/layouts/PublicLayout";

const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: (
      <PublicLayout>
        <h1>Public Route</h1>
      </PublicLayout>
    ),
  },
];

export default publicRoutes;
