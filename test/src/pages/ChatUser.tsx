import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  useAppSelector,
  useSignalingSession,
  useConnectionManager,
} from "@/lib/hooks";

import {
  selectConversationMessages,
  selectIsUserTyping,
} from "@/lib/store/slices/messagesSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

import {
  ArrowLeft,
  Send,
  Circle,
  Loader2,
  WifiOff,
  RefreshCw,
} from "lucide-react";

import { CONNECTION_STATUS } from "@/lib/constants";

const ChatUser = () => {
  const { username } = useParams();
  const targetUsername = decodeURIComponent(username as string);
  const [message, setMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null!);

  const { currentUser } = useAppSelector((state) => state.user);
  const connection = useAppSelector(
    (state) => state.connections.connections[targetUsername]
  );
  const messages = useAppSelector((state) =>
    selectConversationMessages(state, targetUsername)
  );
  const isTyping = useAppSelector((state) =>
    selectIsUserTyping(state, targetUsername)
  );

  const { signaling, signalingConnected } = useSignalingSession();
  const { connectionManager, connectToUser } = useConnectionManager(
    signaling,
    signalingConnected
  );

  const reconnect = async () => {};

  const connectionState = connection?.state || "new";
  const connectionStatus = CONNECTION_STATUS[connectionState];

  if (!targetUsername || !currentUser) return null;

  return (
    <>
      {/* Messages Area */}
      <div className="relative min-h-0 flex-1">
        <ScrollArea className="scrollbar-thin h-full">
          <div className="p-4 pb-2">
            {connectionState === "connecting" && !messages.length && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="text-muted-foreground mb-4 size-8 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Establishing secure P2P connection...
                </p>
              </div>
            )}

            {connectionState === "failed" && (
              <Card className="bg-destructive/10 mx-auto max-w-sm p-4">
                <div className="flex flex-col items-center text-center">
                  <WifiOff className="text-destructive mb-2 size-8" />
                  <p className="mb-3 text-sm font-medium">Connection Failed</p>
                  <p className="text-muted-foreground mb-4 text-xs">
                    Unable to establish P2P connection with {targetUsername}
                  </p>
                  <Button size="sm" onClick={reconnect} disabled={isConnecting}>
                    {isConnecting ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-4" />
                    )}
                    Try Again
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === currentUser.username}
                />
              ))}
            </div>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Typing Indicator */}

      {/* Input Area */}
      <div className="bg-card shrink-0 border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="flex gap-2"
        ></form>
      </div>
    </>
  );
};

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    timestamp: number;
    status: string;
    senderId: string;
  };
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: Readonly<MessageBubbleProps>) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 sm:max-w-[70%] ${
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        <p className="text-sm wrap-break-word sm:text-base">
          {message.content}
        </p>

        <div
          className={`mt-1 flex items-center gap-2 text-xs ${
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {isOwn && (
            <span>
              {message.status === "pending" && "⏳"}
              {message.status === "sent" && "✓"}
              {message.status === "delivered" && "✓✓"}
              {message.status === "failed" && "❌"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatUser;
