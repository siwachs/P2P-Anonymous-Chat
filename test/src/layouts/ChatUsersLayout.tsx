import { type FC, type ReactNode, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";

import { getCountryViaCode } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ArrowLeft,
  Search,
  Users,
  Circle,
  X,
  User,
  Heart,
  Sparkles,
  Shield,
} from "lucide-react";

import type { OnlineUser } from "@/types";

const ChatUsersLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<
    OnlineUser["gender"] | "all"
  >("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const { currentUser } = useAppSelector((state) => state.user);
  const { users, isConnected } = useAppSelector((state) => state.onlineUsers);
  const onlineUsers = Object.values(users);

  const filteredUsers = useMemo(() => {
    return onlineUsers.filter((user) => {
      if (user.username === currentUser?.username) return false;

      // Search filter
      if (
        searchQuery &&
        !user.username.toLowerCase().includes(searchQuery.toLocaleLowerCase())
      )
        return false;

      // Gender Filter
      if (genderFilter !== "all" && user.gender !== genderFilter) return false;

      // Country Filter
      if (countryFilter !== "all" && user.country !== countryFilter)
        return false;

      return true;
    });
  }, [
    searchQuery,
    onlineUsers,
    currentUser?.username,
    genderFilter,
    countryFilter,
  ]);

  const availableCountries = useMemo(() => {
    const countryCodes = [...new Set(onlineUsers.map((user) => user.country))];

    return countryCodes.sort((a, b) => a.localeCompare(b));
  }, [onlineUsers]);

  const hasActiveFilters =
    genderFilter !== "all" || countryFilter !== "all" || searchQuery;

  const clearFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
    setCountryFilter("all");
  };

  const onUserClick = (username: string) => {
    navigate(`/chat/${username}`);
  };

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
