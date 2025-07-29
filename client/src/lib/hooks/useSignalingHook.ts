import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { SignalingClient } from "@/lib/signaling/signalingClient";

import {
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updateUserStatus,
  setConnectionStatus,
} from "@/lib/store/slices/onlineUsersSlice";
import { setTypingUser } from "@/lib/store/slices/messagesSlice";

import { OnlineUser } from "@/types/onlineUser";

export const useSignalingHook = () => {
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
          status: user.status as OnlineUser["status"],
          connectedAt: Date.now(),
        }));

        dispatch(setOnlineUsers(onlineUsers));
      },

      onUserOnline: ({ username }) => {
        dispatch(
          addOnlineUser({
            username,
            status: "online",
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

      onRegisterSuccess: () => {
        dispatch(setConnectionStatus(true));
      },

      onRegisterError: (error) => {
        console.error("Registration failed:", error);
        dispatch(setConnectionStatus(false));
      },
    });

    client.connect(currentUser.username);

    signalingRef.current = client;
  }, [currentUser, dispatch]);

  return {
    signaling: signalingRef.current,
    onlineUsers: Object.values(users),
    isConnected,
    currentUsername: currentUser?.username,
  };
};
