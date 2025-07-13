"use client";

import { useAppSelector } from "@/lib/store/hooks";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Settings, Users, MessageSquare } from "lucide-react";

export default function ChatPage() {
  const { currentUser } = useAppSelector((state) => state.user);

  if (!currentUser) return null;

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">P2P Chat</h1>
              <Badge variant="outline" className="text-xs">
                Connected as: {currentUser.username}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Settings className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                  {currentUser.age} • {currentUser.gender}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Country:</span>{" "}
                {currentUser.country}
              </p>

              {currentUser.interests.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    Interests:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {currentUser.interests.map((interest, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
              >
                <Users className="size-8" />
                <span>Join Public Room</span>
                <span>Chat with multiple people</span>
              </Button>

              <Button size="lg" className="flex h-auto flex-col gap-2 py-6">
                <MessageSquare className="size-8" />
                <span>Private Chat</span>
                <span>1-on-1 conversation</span>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
