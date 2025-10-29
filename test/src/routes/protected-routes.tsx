import type { RouteObject } from "react-router-dom";

import ChatLayout from "@/layouts/ChatLayout";

export const protectedRoutes: RouteObject[] = [
  {
    path: "/chat",
    element: (
      <ChatLayout>
        <h1>Chat Page</h1>
      </ChatLayout>
    ),
  },
];
