import type { RouteObject } from "react-router-dom";

import { PublicLayout } from "@/layouts";
import { Login } from "@/pages";

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
