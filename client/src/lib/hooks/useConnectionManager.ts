import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useUserPersistence } from "./useUserPersistence";
import { useSignaling } from "./useSignaling";

import { ConnectionManager } from "@/lib/webrtc/ConnectionManager";
import { setTypingUser } from "@/lib/store/slices/messagesSlice";

export const useConnectionManager = () => {
  const dispatch = useAppDispatch();
  const connectionManagerRef = useRef<ConnectionManager | null>(null);

  const { currentUser } = useUserPersistence();
  const { signaling } = useSignaling();

  useEffect(() => {
    if (!currentUser || !signaling) return;
  }, [currentUser, signaling]);
};
