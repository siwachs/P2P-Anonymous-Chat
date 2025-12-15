import type { RouteObject } from "react-router-dom";

import {
  ProvidersLayout,
  ChatLayout,
  ChatUsersLayout,
  ChatUserLayout,
} from "@/layouts";
import { Chat, ChatUsers } from "@/pages";

const protectedRoutes: RouteObject[] = [
  {
    element: <ProvidersLayout />,
    children: [
      {
        path: "/chat",
        element: (
          <ChatLayout>
            <Chat />
          </ChatLayout>
        ),
      },
      {
        path: "/chat/users",
        element: (
          <ChatUsersLayout>
            <ChatUsers />
          </ChatUsersLayout>
        ),
      },
      {
        path: "/chat/users/:username",
        element: (
          <ChatUserLayout>
            <h1>Chat Page</h1>
          </ChatUserLayout>
        ),
      },
    ],
  },
];

export default protectedRoutes;
