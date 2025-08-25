import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppStore, useAppSelector } from "@/lib/store/hooks";
import { useSignaling } from "./useSignaling";

import { ConnectionManager } from "@/lib/webrtc/ConnectionManager";
import { setTypingUser } from "@/lib/store/slices/messagesSlice";

export const useConnectionManager = () => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const connectionManagerRef = useRef<ConnectionManager | null>(null);

  const { currentUser } = useAppSelector((state) => state.user);
  const { signaling, isConnected } = useSignaling();

  useEffect(() => {
    if (
      !currentUser?.username ||
      !signaling ||
      !isConnected ||
      connectionManagerRef.current
    )
      return;

    const connectionManager = new ConnectionManager({
      currentUsername: currentUser.username,
      signalingClient: signaling,
      store,
      onTypingUpdate: (username, isTyping) => {
        dispatch(setTypingUser({ username, isTyping }));
      },
    });

    connectionManagerRef.current = connectionManager;

    return () => {
      connectionManager.destroy();
      connectionManagerRef.current = null;
    };
  }, [currentUser?.username, signaling, isConnected, dispatch, store]);

  const sendMessage = useCallback((targetUsername: string, message: string) => {
    if (!connectionManagerRef.current)
      throw new Error("ConnectionManager is not initialized");

    connectionManagerRef.current.sendMessage(targetUsername, message);
  }, []);

  const connectToUser = useCallback(async (targetUsername: string) => {
    if (!connectionManagerRef.current)
      throw new Error("ConnectionManager is not initialized");

    await connectionManagerRef.current.connectToUser(targetUsername);
  }, []);

  const disconnectFromUser = useCallback((targetUsername: string) => {
    if (!connectionManagerRef.current) return;

    connectionManagerRef.current.disconnectFromUser(targetUsername);
  }, []);

  return {
    connectionManager: connectionManagerRef.current,
    sendMessage,
    connectToUser,
    disconnectFromUser,
  };
};
