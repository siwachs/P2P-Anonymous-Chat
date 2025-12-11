import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";

import { getCountryViaCode } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { Users, MessageSquare } from "lucide-react";

const Chat = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppSelector((state) => state.user);

  const joinPublicRoom = () => {
    console.log("Join public room");
  };

  const privateChat = () => {
    navigate("/chat/users");
  };

  if (!currentUser) return;

  const country = getCountryViaCode(currentUser.country);

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* User Info Card */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-lg">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="font-semibold">{currentUser.username}</h2>
              <p className="text-muted-foreground text-sm">
                {currentUser.age} •{" "}
                {currentUser.gender === "Prefer not to say"
                  ? "private"
                  : currentUser.gender}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Country:</span>
              <span>{country.flag}</span>
              <span>
                {country.name} ({currentUser.country})
              </span>
            </p>

            {currentUser.interests.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Interests:</p>
                <div className="flex flex-wrap gap-1">
                  {currentUser.interests.map((interest, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 border-t pt-4">
              <p className="text-muted-foreground text-xs">
                Session expires:{" "}
                {new Date(currentUser.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Action Cards */}
        <Card className="p-6 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Start Chatting</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Button
              size="lg"
              className="flex h-auto flex-col gap-2 py-6"
              variant="outline"
              onClick={joinPublicRoom}
              disabled
            >
              <Users className="size-8" />
              <span>Join Public Room</span>
              <span className="text-muted-foreground text-xs">
                Coming soon...
              </span>
            </Button>

            <Button
              size="lg"
              className="flex h-auto flex-col gap-2 py-6"
              onClick={privateChat}
            >
              <MessageSquare className="size-8" />
              <span>Private Chat</span>
              <span className="text-muted-foreground text-xs">
                1-on-1 conversation
              </span>
            </Button>
          </div>

          <div className="bg-muted mt-6 rounded-lg p-4">
            <h3 className="mb-2 font-medium">🔒 Your Privacy is Protected</h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>• All messages are end-to-end encrypted</li>
              <li>• No chat history is stored on servers</li>
              <li>• Direct peer-to-peer connections</li>
              <li>• Anonymous - no personal data required</li>
            </ul>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default Chat;
