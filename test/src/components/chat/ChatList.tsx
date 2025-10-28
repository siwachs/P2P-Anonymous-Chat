"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Circle } from "lucide-react";

export default function ChatList() {
  const router = useRouter();
  const connections = useAppSelector((state) => state.connections.connections);
  const { conversationMessages, messages } = useAppSelector(
    (state) => state.messages,
  );
  const activeConnection = useAppSelector(
    (state) => state.connections.activeConnection,
  );

  const chatList = useMemo(
    () =>
      Object.entries(connections).map(([username, connection]) => {
        const lastMessageId =
          conversationMessages[username]?.[
            conversationMessages[username].length - 1
          ];
        const lastMessage = lastMessageId ? messages[lastMessageId] : null;

        return { username, connection, lastMessage, unreadCount: 0 };
      }),

    [connections, conversationMessages, messages],
  );

  if (chatList.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground text-sm">No active chats</p>
        <p className="text-muted-foreground text-xs">
          Start a conversation from the users list
        </p>
      </div>
    );

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {chatList.map(({ username, connection, lastMessage, unreadCount }) => (
          <div
            key={username}
            onClick={() => router.push(`/chat/${username}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                router.push(`/chat/${username}`);
            }}
            className={`hover:bg-accent cursor-pointer rounded-lg p-3 transition-colors ${
              activeConnection === username ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="size-10">
                <AvatarFallback>
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{username}</h4>
                  <Circle
                    className={`h-2 w-2 ${
                      connection.state === "connected"
                        ? "fill-green-500"
                        : "fill-gray-400"
                    }`}
                  />
                </div>

                {lastMessage && (
                  <p className="text-muted-foreground truncate text-sm">
                    {lastMessage.senderId === username ? "" : "You: "}
                    {lastMessage.content}
                  </p>
                )}

                <p className="text-muted-foreground text-xs">
                  {connection.state}
                </p>
              </div>

              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
