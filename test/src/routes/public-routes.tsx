import type { RouteObject } from "react-router-dom";

import PublicLayout from "@/layouts/PublicLayout";
import Login from "@/pages/Login";

const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: (
      <PublicLayout>
        <Login />
      </PublicLayout>
    ),
  },
];

export default publicRoutes;
