import type { RouteObject } from "react-router-dom";

import { ChatLayout, ChatUsersLayout } from "@/layouts";

const protectedRoutes: RouteObject[] = [
  {
    path: "/chat",
    element: (
      <ChatLayout>
        <h1>Chat Page</h1>
      </ChatLayout>
    ),
  },
  {
    path: "/chat/users",
    element: (
      <ChatUsersLayout>
        <h1>Users Page</h1>
      </ChatUsersLayout>
    ),
  },
  {
    path: "/chat/users/:username",
    element: (
      <ChatLayout>
        <h1>Chat Page</h1>
      </ChatLayout>
    ),
  },
];

export default protectedRoutes;
