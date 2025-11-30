import { useEffect, useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import useSignalingCore from "./useSignalingCore";
import {
  getSignalingInstance,
  clearSignalingInstance,
} from "../signaling/signalingInstance";
import { toast } from "sonner";
import { toastStyles } from "@/lib/themes";

import { userStorage } from "@/lib/db";
import {
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setConnectionStatus,
} from "@/lib/store/slices/onlineUsersSlice";
import { clearUser } from "@/lib/store/slices/userSlice";
import { setTypingUser } from "@/lib/store/slices/messagesSlice";

export default function useSignalingSession() {
  const [hasError, setHasError] = useState(true);
  const { signaling, connected } = useSignalingCore();
  const dispatch = useAppDispatch();

  const { currentUser } = useAppSelector((s) => s.user);

  const disconnect = useCallback(() => {
    try {
      signaling.disconnect();
    } catch (error) {
      console.error(error);
    }

    dispatch(setConnectionStatus(false));
    dispatch(setOnlineUsers([]));
  }, [signaling, dispatch]);

  const reset = useCallback(async () => {
    await userStorage.clearUser();
    dispatch(clearUser());
    clearSignalingInstance();
  }, [dispatch]);

  const retry = useCallback(() => {
    setHasError(false);

    clearSignalingInstance();
    getSignalingInstance();
  }, []);

  useEffect(() => {
    signaling.on("onConnectError", (error) => {
      console.error(error);
      setHasError(true);
      toast.error((error as Error).message, toastStyles.error);
    });

    signaling.on("onRegisterSuccess", ({ username }) => {
      dispatch(setConnectionStatus(true));
      setHasError(false);
      toast.success(`Connected as ${username}`, toastStyles.success);
    });

    signaling.on("onRegisterError", ({ message }) => {
      dispatch(setConnectionStatus(false));
      dispatch(setOnlineUsers([]));
      setHasError(true);
      toast.error(message, toastStyles.error);
    });

    signaling.on("onUsersUpdate", (users) => {
      dispatch(setOnlineUsers(users));
    });

    signaling.on("onUserOnline", (u) => {
      dispatch(addOnlineUser(u));
    });

    signaling.on("onUserOffline", (u) => {
      dispatch(removeOnlineUser(u.username));
    });

    signaling.on("onPrivateSignal", () => {});

    signaling.on("onTypingStart", ({ fromUsername }) => {
      dispatch(setTypingUser({ username: fromUsername, isTyping: true }));
    });

    signaling.on("onTypingStop", ({ fromUsername }) => {
      dispatch(setTypingUser({ username: fromUsername, isTyping: false }));
    });

    if (currentUser) {
      signaling.connect({
        username: currentUser.username,
        age: currentUser.age,
        gender: currentUser.gender,
        country: currentUser.country,
        interests: currentUser.interests,
      });
    }

    return () => {
      signaling.off("onConnectError");

      signaling.off("onRegisterSuccess");
      signaling.off("onRegisterError");

      signaling.off("onUsersUpdate");
      signaling.off("onUserOnline");
      signaling.off("onUserOffline");

      signaling.off("onPrivateSignal");
      signaling.off("onTypingStart");
      signaling.off("onTypingStop");

      disconnect();
    };
  }, [signaling, currentUser, dispatch, disconnect]);

  return {
    signaling,
    signalingConnected: connected,
    disconnect,
    reset,
    retry,
    signalingHasError: hasError,
  };
}
