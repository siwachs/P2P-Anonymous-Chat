import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/store/hooks";
import { ConnectionManager } from "../rtc";

import { setTypingUser } from "@/lib/store/slices/messagesSlice";

import type SignalingClient from "../signaling/SignalingClient";
import type { Message } from "@/types";

export default function useConnectionManager(
  signaling: SignalingClient,
  signalingConnected: boolean
) {
  const ref = useRef<ConnectionManager | null>(null);
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const currentUsername = useAppSelector((s) => s.user.currentUser?.username);

  useEffect(() => {
    if (!currentUsername || !signalingConnected) return;
    if (ref.current) return;

    const manager = new ConnectionManager({
      currentUsername,
      signalingClient: signaling,
      store,
      onTypingUpdate: (u, t) => {
        dispatch(setTypingUser({ username: u, isTyping: t }));
      },
    });

    ref.current = manager;

    return () => {
      manager.destroy();
      ref.current = null;
    };
  }, [currentUsername, signalingConnected, signaling, dispatch, store]);

  const sendMessage = useCallback(
    (
      targetUsername: string,
      content: string,
      type: Message["type"],
      metadata?: Message["metadata"]
    ) => {
      return ref.current?.sendMessage(targetUsername, content, type, metadata);
    },
    []
  );

  const connectToUser = useCallback(async (targetUsername: string) => {
    return ref.current?.connectToUser(targetUsername);
  }, []);

  const disconnectFromUser = useCallback((targetUsername: string) => {
    return ref.current?.disconnectFromUser(targetUsername);
  }, []);

  const sendTyping = useCallback(
    (targetUsername: string, isTyping: boolean) => {
      return ref.current?.sendTyping(targetUsername, isTyping) || false;
    },
    []
  );

  return {
    connectionManager: ref.current,
    sendMessage,
    connectToUser,
    disconnectFromUser,
    sendTyping,
  };
}
