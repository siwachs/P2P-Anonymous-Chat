import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { SignalingClient } from "@/lib/signaling/signalingClient";
import { toast } from "sonner";

import {
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updateUserStatus,
  setConnectionStatus,
} from "@/lib/store/slices/onlineUsersSlice";
import { setTypingUser } from "@/lib/store/slices/messagesSlice";

import type { OnlineUser } from "@/types/onlineUser";

/**
 * useSignaling — One-time hook to manage the SignalingClient lifecycle.
 *
 * 👉 Should only be used by <P2PProvider /> (top-level).
 * ❌ Never use inside children or multiple components — will cause race conditions.
 */
export const useSignaling = () => {
  const signalingRef = useRef<SignalingClient | null>(null);
  const isConnectingRef = useRef(false);
  const hasErrorRef = useRef(false);

  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const { isConnected } = useAppSelector((state) => state.onlineUsers);
  
  const disconnect = useCallback(() => {
    const client = signalingRef.current;
    if (client) {
      client.disconnect();
      signalingRef.current = null;
    }

    isConnectingRef.current = false;
    hasErrorRef.current = false;

    dispatch(setConnectionStatus(false));
    dispatch(setOnlineUsers([]));
  }, [dispatch]);

  // Initialize signaling connection once
  useEffect(() => {
    // User logged out → cleanup connection
    if (!currentUser?.username) {
      disconnect();
      return;
    }

    // Already connected with same user → do nothing
    if (
      signalingRef.current?.isConnected &&
      signalingRef.current.currentUsername === currentUser.username
    ) {
      return;
    }

    // Prevent reconnect attempts after fatal error
    if (hasErrorRef.current) return;

    // Logged in user changed → reset previous connection
    if (
      signalingRef.current?.currentUsername &&
      signalingRef.current.currentUsername !== currentUser.username
    ) {
      disconnect();
    }

    // Prevent multiple initializations / race conditions
    if (isConnectingRef.current || signalingRef.current) return;

    isConnectingRef.current = true;
    hasErrorRef.current = false;

    // Create and configure client
    const client = new SignalingClient();

    client.setEventHandlers({
      // -------------------- USER EVENTS --------------------
      onUsersUpdate(users) {
        const formatted: OnlineUser[] = users.map((u) => ({
          username: u.username,
          age: u.age,
          gender: u.gender,
          country: u.country,
          interests: u.interests,
          status: u.status,
          connectedAt: Date.now(),
        }));
        dispatch(setOnlineUsers(formatted));
      },

      onUserOnline(user) {
        dispatch(
          addOnlineUser({
            ...user,
            connectedAt: Date.now(),
          })
        );
      },

      onUserOffline({ username }) {
        dispatch(removeOnlineUser(username));
      },

      onUserDisconnected({ username }) {
        dispatch(updateUserStatus({ username, status: "away" }));
      },

      // -------------------- TYPING EVENTS --------------------
      onTypingStart({ fromUsername }) {
        dispatch(setTypingUser({ username: fromUsername, isTyping: true }));
      },

      onTypingStop({ fromUsername }) {
        dispatch(setTypingUser({ username: fromUsername, isTyping: false }));
      },

      // -------------------- CONNECTION EVENTS --------------------
      onRegisterSuccess({ username }) {
        toast.success("Connected Successfully! ✅", {
          description: `You are now online as ${username || currentUser.username}`,
        });
        isConnectingRef.current = false;
        hasErrorRef.current = false;
        dispatch(setConnectionStatus(true));
      },

      onRegisterError({ message }) {
        toast.error("Connection Failed ❌", {
          description:
            message || "Failed to connect to signaling server. Please try again.",
        });

        dispatch(setConnectionStatus(false));
        dispatch(setOnlineUsers([]));

        isConnectingRef.current = false;
        hasErrorRef.current = true;
      },

      // -------------------- SOCKET.IO INTERNALS --------------------
      onReconnectAttempt(attempt) {
        toast.message("Reconnecting...", {
          description: `Attempt ${attempt}`,
        });
      },

      onReconnectFailed() {
        toast.error("Reconnection failed ❌", {
          description:
            "Unable to reconnect to signaling server after several attempts.",
        });
        dispatch(setConnectionStatus(false));
        hasErrorRef.current = true;
      },

      onConnectError(error) {
        console.error("[Signaling] Connection error:", error);
      },
    });

    // Establish socket connection
    client.connect({
      username: currentUser.username,
      age: currentUser.age,
      gender: currentUser.gender,
      country: currentUser.country,
      interests: currentUser.interests,
    });

    signalingRef.current = client;

    // Cleanup on logout or error only
    return () => {
      if (!currentUser?.username || hasErrorRef.current) {
        disconnect();
      }
    };
  }, [currentUser, disconnect, dispatch]);

  return {
    signaling: signalingRef.current,
    isConnected,
    hasError: hasErrorRef.current,
  };
};
