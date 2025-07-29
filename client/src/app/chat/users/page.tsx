"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { useUserPersistence } from "@/lib/hooks/useUserPersistence";
import { useSignalingHook } from "@/lib/hooks/useSignalingHook";

import { userStorage } from "@/lib/db/userStorage";
import { clearUser } from "@/lib/store/slices/userSlice";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Search, Users, Circle } from "lucide-react";

export default function OnlineUsersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useUserPersistence();

  const logout = async () => {
    await userStorage.clearUser();
    dispatch(clearUser());
    router.replace("/");
  };

  const joinPublicRoom = () => {
    // TODO: Implement public room functionality
    console.log("Join public room");
  };

  return <></>;
}
