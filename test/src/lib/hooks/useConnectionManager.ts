import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppStore, useAppSelector } from "@/lib/store/hooks";
import { useSignaling } from "./useSignaling";

import { ConnectionManager } from "@/lib/webrtc";
import { setTypingUser } from "@/lib/store/slices/messagesSlice";

import type { Message } from "@/types";

/**
 * useConnectionManager — handles WebRTC peer connections for the current user.
 * Depends on active SignalingClient and Redux store.
 */
export const useConnectionManager = () => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const connectionManagerRef = useRef<ConnectionManager | null>(null);

  const { currentUser } = useAppSelector((state) => state.user);
  const { signaling, isConnected: isSignalingConnected } = useSignaling();

  useEffect(() => {
    const username = currentUser?.username;

    if (!username || !signaling || !isSignalingConnected) return;
    if (connectionManagerRef.current) return;

    const manager = new ConnectionManager({
      currentUsername: username,
      signalingClient: signaling,
      store,
      onTypingUpdate: (username, isTyping) => {
        dispatch(setTypingUser({ username, isTyping }));
      },
    });

    connectionManagerRef.current = manager;

    console.log("[useConnectionManager] Initialized for", username);

    return () => {
      console.log("[useConnectionManager] Destroying...");
      manager.destroy();
      connectionManagerRef.current = null;
    };
  }, [currentUser?.username, signaling, isSignalingConnected, dispatch, store]);

  const sendMessage = useCallback(
    (
      targetUsername: string,
      content: string,
      type: Message["type"] = "text",
      metadata?: Message["metadata"]
    ) => {
      connectionManagerRef.current?.sendMessage(
        targetUsername,
        content,
        type,
        metadata
      );
    },
    []
  );

  const connectToUser = useCallback(async (targetUsername: string) => {
    await connectionManagerRef.current?.connectToUser(targetUsername);
  }, []);

  const disconnectFromUser = useCallback((targetUsername: string) => {
    connectionManagerRef.current?.disconnectFromUser(targetUsername);
  }, []);

  return {
    connectionManager: connectionManagerRef.current,
    sendMessage,
    connectToUser,
    disconnectFromUser,
  };
};
