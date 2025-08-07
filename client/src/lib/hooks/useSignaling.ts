import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { SignalingClient } from "@/lib/signaling/signalingClient";
import { toast } from "sonner";

import { clearUser } from "@/lib/store/slices/userSlice";
import {
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updateUserStatus,
  setConnectionStatus,
} from "@/lib/store/slices/onlineUsersSlice";
import { setTypingUser } from "@/lib/store/slices/messagesSlice";

import { OnlineUser } from "@/types/onlineUser";

export const useSignaling = () => {
  const signalingRef = useRef<SignalingClient | null>(null);
  const dispatch = useAppDispatch();

  const { currentUser } = useAppSelector((state) => state.user);
  const { users, isConnected } = useAppSelector((state) => state.onlineUsers);

  useEffect(() => {
    if (!currentUser) return;

    const client = new SignalingClient();
    client.setEventHandlers({
      onUsersUpdate(users) {
        const onlineUsers: OnlineUser[] = users.map((user) => ({
          username: user.username,
          age: user.age,
          gender: user.gender,
          country: user.country,
          interests: user.interests,
          status: user.status,
          connectedAt: Date.now(),
        }));

        dispatch(setOnlineUsers(onlineUsers));
      },

      onUserOnline: (user) => {
        dispatch(
          addOnlineUser({
            username: user.username,
            age: user.age,
            gender: user.gender,
            country: user.country,
            interests: user.interests,
            status: user.status,
            connectedAt: Date.now(),
          }),
        );
      },

      onUserOffline: ({ username }) => {
        dispatch(removeOnlineUser(username));
      },

      onUserDisconnected: ({ username }) => {
        dispatch(updateUserStatus({ username, status: "away" }));
      },

      onTypingStart: ({ fromUsername }) => {
        dispatch(setTypingUser({ username: fromUsername, isTyping: true }));
      },

      onTypingStop: ({ fromUsername }) => {
        dispatch(setTypingUser({ username: fromUsername, isTyping: false }));
      },

      onRegisterSuccess: ({ username }) => {
        toast("Connected Successfully! ✅", {
          description: `You are now online as ${username || currentUser.username}`,
        });
        dispatch(setConnectionStatus(true));
      },

      onRegisterError: ({ message }) => {
        toast.error("Connection Failed ❌", {
          description:
            message ||
            "Failed to connect to signaling server. Please try again.",
        });
        dispatch(clearUser());
        dispatch(setConnectionStatus(false));
        dispatch(setOnlineUsers([]));
      },
    });

    client.connect({
      username: currentUser.username,
      age: currentUser.age,
      gender: currentUser.gender,
      country: currentUser.country,
      interests: currentUser.interests,
    });

    signalingRef.current = client;
  }, [currentUser, dispatch]);

  return {
    signaling: signalingRef.current,
    onlineUsers: Object.values(users),
    isConnected,
    currentUsername: currentUser?.username,
  };
};
