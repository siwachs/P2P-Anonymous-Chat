import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { SignalingClient } from "@/lib/signaling/signalingClient";
import { toast } from "sonner";

import { userStorage } from "@/lib/db/userStorage";
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

/**
 * useSignaling — One-time hook to manage the SignalingClient lifecycle.
 *
 * 👉 Should only be used by <P2PProvider /> (top-level).
 * ❌ Never use inside children or multiple components — will cause race conditions.
 */
export const useSignaling = () => {
  const signalingRef = useRef<SignalingClient | null>(null);
  const [hasError, setHasError] = useState(false);

  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const { isConnected } = useAppSelector((state) => state.onlineUsers);

  const disconnect = useCallback(() => {
    const client = signalingRef.current;
    if (client) {
      client.disconnect();
      signalingRef.current = null;
    }

    setHasError(false);
    dispatch(setConnectionStatus(false));
    dispatch(setOnlineUsers([]));
  }, [dispatch]);

  const retry = useCallback(() => {
    if (hasError) disconnect();
  }, [hasError, disconnect]);

  const reset = useCallback(async () => {
    await userStorage.clearUser();
    dispatch(clearUser());
  }, [dispatch]);

  // Initialize signaling connection once
  useEffect(() => {
    const username = currentUser?.username;

    // User logged out → cleanup connection
    if (!username) {
      disconnect();
      return;
    }

    // Already connected with same user → do nothing
    if (
      signalingRef.current?.isConnected &&
      signalingRef.current.currentUsername === username
    ) {
      return;
    }

    // Prevent reconnect attempts after fatal error
    if (hasError) return;

    // Logged in user changed → reset previous connection
    if (
      signalingRef.current?.currentUsername &&
      signalingRef.current.currentUsername !== username
    ) {
      disconnect();
    }

    // Prevent multiple initializations / race conditions
    if (
      signalingRef.current &&
      signalingRef.current.connectionState !== "disconnected"
    )
      return;

    // Create and configure client
    const client = new SignalingClient();

    // // Store user data in closure to avoid dependency issues
    // const userData = {

    // };

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
          description: `You are now online as ${
            username || currentUser.username
          }`,
        });

        dispatch(setConnectionStatus(true));
        setHasError(false);
      },

      onRegisterError({ message }) {
        toast.error("Connection Failed ❌", {
          description:
            message ||
            "Failed to connect to signaling server. Please try again.",
        });

        dispatch(setConnectionStatus(false));
        dispatch(setOnlineUsers([]));
        setHasError(true);
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
        setHasError(true);
      },

      onConnectError(error) {
        console.error("[Signaling] Connection error:", error);

        setHasError(true);
      },
    });

    // Establish socket connection
    client.connect({
      username,
      age: currentUser.age,
      gender: currentUser.gender,
      country: currentUser.country,
      interests: currentUser.interests,
    });

    signalingRef.current = client;

    // Cleanup on logout or error only
    return () => {
      if (!username) {
        disconnect();
      }
    };
  }, [currentUser, disconnect, dispatch, hasError]);

  return {
    signaling: signalingRef.current,
    isConnected,
    disconnect,
    retry,
    reset,
    hasError,
  };
};
