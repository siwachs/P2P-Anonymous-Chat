import type { RouteObject } from "react-router-dom";

import {
  ProvidersLayout,
  ChatLayout,
  ChatUsersLayout,
  ChatUserLayout,
} from "@/layouts";
import { Chat, ChatUsers, ChatUser } from "@/pages";

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
            <ChatUser />
          </ChatUserLayout>
        ),
      },
    ],
  },
];

export default protectedRoutes;
