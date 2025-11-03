import { useCallback, useEffect, useRef } from "react";
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

import type { OnlineUser } from "@/types/onlineUser";

export const useSignaling = () => {
  const signalingRef = useRef<SignalingClient | null>(null);
  const isConnectingRef = useRef(false);
  const hasErrorRef = useRef(false);
  const dispatch = useAppDispatch();

  const { currentUser } = useAppSelector((state) => state.user);
  const { isConnected } = useAppSelector((state) => state.onlineUsers);

  const disconnect = useCallback(() => {
    if (!signalingRef.current) return;

    signalingRef.current.disconnect();
    signalingRef.current = null;
    isConnectingRef.current = false;
    hasErrorRef.current = false;
    dispatch(setConnectionStatus(false));
  }, [dispatch]);

  useEffect(() => {
    if (!currentUser?.username) {
      return disconnect();
    }

    if (
      signalingRef.current?.isConnected &&
      signalingRef.current?.currentUsername === currentUser.username
    )
      return;

      if(hasErrorRef.current)return;

    if (
      signalingRef.current?.currentUsername &&
      signalingRef.current?.currentUsername !== currentUser.username
    ) {
      disconnect();
    }

    if(signalingRef.current && !signalingRef.current.isConnected && !isConnectingRef.current) return;

    if(signalingRef.current) return;

    isConnectingRef.current = true;
    hasErrorRef.current = false;
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
        isConnectingRef.current = false;
        hasErrorRef.current = false;
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
        isConnectingRef.current = false;
        hasErrorRef.current = true;
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

    return () => {
      if (!currentUser?.username || hasErrorRef.current) {
        disconnect();
      }
    };
  }, [disconnect, currentUser, dispatch]);

  return {
    signaling: signalingRef.current,
    isConnected,
    currentUsername: currentUser?.username,
    disconnect,
    hasError: hasErrorRef.current,
  };
};
