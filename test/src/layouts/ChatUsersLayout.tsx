import { type FC, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Circle } from "lucide-react";

const ChatUsersLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const { currentUser } = useAppSelector((state) => state.user);
  const { isConnected } = useAppSelector((state) => state.onlineUsers);

  if (!currentUser) return;

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
            >
              <ArrowLeft className="size-5" />
            </Button>

            <div>
              <h1 className="text-xl font-semibold">Online Users</h1>
              <p className="text-muted-foreground text-sm">
                {filteredUsers.length} of {onlineUsers.length - 1} users
              </p>
            </div>

            <Badge
              variant={isConnected ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              <Circle
                className={`size-2 ${
                  isConnected ? "fill-green-500" : "fill-gray-500"
                }`}
              />
              {isConnected ? "Connected" : "Connectiong..."}
            </Badge>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
};

export default ChatUsersLayout;
