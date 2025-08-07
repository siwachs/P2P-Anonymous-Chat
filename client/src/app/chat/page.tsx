"use client";

import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { useUserPersistence } from "@/lib/hooks/useUserPersistence";

import { getCountryViaCode } from "@/lib/utils";
import { userStorage } from "@/lib/db/userStorage";
import { clearUser } from "@/lib/store/slices/userSlice";

import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { Settings, Users, MessageSquare, LogOut } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { currentUser } = useUserPersistence();

  const logout = async () => {
    await userStorage.clearUser();
    dispatch(clearUser());
    router.push("/");
  };

  const joinPublicRoom = () => {
    // TODO: Implement public room functionality
    console.log("Join public room");
  };

  const privateChat = () => {
    router.push("/chat/users");
  };

  if (!currentUser) return;

  const country = getCountryViaCode(currentUser.country);

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
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Settings className="size-5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <LogOut className="size-5" />
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to logout?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear your local data and return you to the
                      landing page. You&apos;ll need to set up a new username to
                      chat again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={logout}>
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
    </div>
  );
}
