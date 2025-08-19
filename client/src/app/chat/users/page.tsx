"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserPersistence } from "@/lib/hooks/useUserPersistence";
import { useSignaling } from "@/lib/hooks/useSignaling";

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

import { OnlineUser } from "@/types/onlineUser";

export default function OnlineUsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<
    OnlineUser["gender"] | "all"
  >("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const { currentUser } = useUserPersistence();
  const { onlineUsers, isConnected } = useSignaling();

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
    router.push(`/chat/${username}`);
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
              onClick={() => router.push("/chat")}
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
                className={`size-2 ${isConnected ? "fill-green-500" : "fill-gray-500"}`}
              />
              {isConnected ? "Connected" : "Connectiong..."}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative sm:max-w-md sm:flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Select
                value={genderFilter}
                onValueChange={(v) =>
                  setGenderFilter(v as OnlineUser["gender"] | "all")
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      All Genders
                    </div>
                  </SelectItem>
                  <SelectItem value="Male">
                    <div className="flex items-center gap-2">
                      <User className="size-4" />
                      Male
                    </div>
                  </SelectItem>
                  <SelectItem value="Female">
                    <div className="flex items-center gap-2">
                      <Heart className="size-4" />
                      Female
                    </div>
                  </SelectItem>
                  <SelectItem value="Others">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4" />
                      Others
                    </div>
                  </SelectItem>
                  <SelectItem value="Prefer not to say">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {availableCountries.map((code) => {
                    const country = getCountryViaCode(code);
                    return (
                      <SelectItem key={code} value={code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                  <X className="ml-1 size-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="text-muted-foreground mx-auto mb-4 size-12" />
            <h3 className="text-lg font-medium">No users found</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {hasActiveFilters
                ? "Try different filters"
                : "Waiting for users..."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.username}
                user={user}
                onClick={() => onUserClick(user.username)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function UserCard({
  user,
  onClick,
}: Readonly<{
  user: OnlineUser;
  onClick: () => void;
}>) {
  const country = getCountryViaCode(user.country);

  return (
    <Card
      className="cursor-pointer p-4 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-12">
          <AvatarFallback className="text-lg font-semibold">
            {user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold">
              {user.username}
            </h3>
            <Badge
              variant={
                user.status === "online"
                  ? "default"
                  : user.status === "busy"
                    ? "destructive"
                    : "secondary"
              }
              className="flex-shrink-0 text-xs"
            >
              <Circle
                className={`mr-1 h-2 w-2 ${user.status === "online" ? "fill-green-500" : user.status === "busy" ? "fill-red-500" : "fill-orange-500"}`}
              />
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </Badge>
          </div>

          {/* User details */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            {user.age === "Prefer not to say" ? (
              <div className="flex items-center gap-1">
                <Shield className="size-3" />
                <span>Private</span>
              </div>
            ) : (
              <span>{user.age}</span>
            )}
            <span>•</span>
            <div className="flex items-center gap-1">
              {user.gender === "Male" ? (
                <User className="size-3" />
              ) : user.gender === "Female" ? (
                <Heart className="size-3" />
              ) : user.gender === "Others" ? (
                <Sparkles className="size-3" />
              ) : (
                <Shield className="size-3" />
              )}
              <span>
                {user.gender === "Prefer not to say" ? "Private" : user.gender}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-base">{country.flag}</span>
            <span className="text-muted-foreground">{country.name}</span>
          </div>

          {/* Interests */}
          {user.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {user.interests.slice(0, 3).map((interest, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {user.interests.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.interests.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
