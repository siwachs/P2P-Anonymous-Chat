import { type FC, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";

import { selectIsUserTyping } from "@/lib/store/slices/messagesSlice";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Circle } from "lucide-react";

import { CONNECTION_STATUS } from "@/lib/constants";

const ChatUserLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const { username } = useParams();
  const targetUsername = decodeURIComponent(username as string);

  const isTyping = useAppSelector((state) =>
    selectIsUserTyping(state, targetUsername)
  );
  const connection = useAppSelector(
    (state) => state.connections.connections[targetUsername]
  );

  const connectionState = connection?.state || "new";
  const connectionStatus = CONNECTION_STATUS[connectionState];

  return (
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      <header className="bg-card shrink-0 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat/users")}
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
                    // TODO: CHECK this behaviour. It ust shows target user State. Not Ours
                    <span className={`text-xs ${connectionStatus.color}`}>
                      {connectionStatus.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Connection Badge */}
          <Badge
            variant={connectionState === "connected" ? "default" : "secondary"}
            className="ml-2 flex shrink-0 items-center gap-1"
          >
            <Circle className={`size-2 ${connectionStatus.color}`} />
            <span className="hidden sm:inline">{connectionState}</span>
          </Badge>
        </div>
      </header>

      {children}
    </div>
  );
};

export default ChatUserLayout;
