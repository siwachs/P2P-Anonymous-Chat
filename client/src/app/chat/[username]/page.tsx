"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { useConnectionManager } from "@/lib/hooks";

import {
  selectConversationMessages,
  selectIsUserTyping,
} from "@/lib/store/slices/messagesSlice";
import { selectOnlineUser } from "@/lib/store/slices/onlineUsersSlice";
import { setActiveConnection } from "@/lib/store/slices/connectionsSlice";

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

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const targetUsername = decodeURIComponent(params.username as string);
  const [message, setMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { currentUser } = useAppSelector((state) => state.user);
  const targetUser = useAppSelector((state) =>
    selectOnlineUser(state, targetUsername),
  );
  const messages = useAppSelector((state) =>
    selectConversationMessages(state, targetUsername),
  );
  const isTyping = useAppSelector((state) =>
    selectIsUserTyping(state, targetUsername),
  );
  const connection = useAppSelector(
    (state) => state.connections.connections[targetUsername],
  );
  const { connectionManager, sendMessage } = useConnectionManager();

  // Set Active Connection
  useEffect(() => {
    dispatch(setActiveConnection(targetUsername));

    return () => {
      dispatch(setActiveConnection(null));
    };
  }, [targetUsername, dispatch]);

  // Initialize P2P connection
  const initConnection = useCallback(async () => {
    if (!connectionManager || !currentUser || !targetUsername) return;

    setIsConnecting(true);
    try {
      await connectionManager.connectToUser(targetUsername);
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [connectionManager, currentUser, targetUsername]);

  useEffect(() => {
    if (!connection || connection.state === "failed") initConnection();
  }, [initConnection, connection]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (!connectionManager || !targetUsername) return;

    const timeoutId = setTimeout(() => {
      connectionManager.sendTyping(targetUsername, message.length > 0);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [message, connectionManager, targetUsername]);

  const handleSendMessage = () => {
    if (!message.trim() || !connectionManager || !targetUsername) return;

    sendMessage(targetUsername, message.trim());
    setMessage("");
    inputRef.current?.focus();
  };

  const sendMessageOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const reconnect = async () => {
    initConnection();
  };

  const connectionState = connection?.state || "new";
  const isConnected = connectionState === "connected";

  if (!targetUsername || !currentUser || !targetUser) return null;

  return (
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      <header className="bg-card shrink-0 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/chat/users")}
            >
              <ArrowLeft className="size-5" />
            </Button>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback>
                  {targetUsername.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h1 className="truncate font-semibold">{targetUsername}</h1>
                <div className="flex items-center gap-2 text-sm">
                  {isTyping ? (
                    <span className="text-muted-foreground">typing...</span>
                  ) : (
                    <ConnectionStatus state={connectionState} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Connection Badge */}
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className="ml-2 flex shrink-0 items-center gap-1"
          >
            <Circle
              className={`size-2 ${
                isConnected
                  ? "fill-green-500"
                  : connectionState === "connecting"
                    ? "fill-yellow-500"
                    : "fill-red-500"
              }`}
            />
            <span className="hidden sm:inline">{connectionState}</span>
          </Badge>
        </div>
      </header>

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

      {isTyping && (
        <div className="absolute-0 bg-background/80 right-0 bottom-0 left-0 border-t px-4 py-2 backdrop-blur-sm">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="flex gap-1">
              <span className="animate-bounce delay-0">•</span>
              <span className="animate-bounce delay-150">•</span>
              <span className="animate-bounce delay-300">•</span>
            </div>

            <span className="truncate">{targetUsername} is typing</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-card shrink-0 border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder={
              isConnected ? "Type a message..." : "Waiting for connection..."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={sendMessageOnEnter}
            disabled={!isConnected}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!isConnected || !message.trim()}
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function ConnectionStatus({ state }: Readonly<{ state: string }>) {
  const statusConfig = {
    new: { text: "Not connected", color: "text-muted-foreground" },
    connecting: { text: "Connecting...", color: "text-yellow-600" },
    connected: { text: "Connected", color: "text-green-600" },
    disconnected: { text: "Disconnected", color: "text-orange-600" },
    failed: { text: "Connection failed", color: "text-red-600" },
    closed: { text: "Connection closed", color: "text-muted-foreground" },
  };
  const config =
    statusConfig[state as keyof typeof statusConfig] || statusConfig.new;

  return <span className={`text-xs ${config.color}`}>{config.text}</span>;
}

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
        <p className="text-sm break-words sm:text-base">{message.content}</p>

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
