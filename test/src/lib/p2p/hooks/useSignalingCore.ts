/**
 * Only manages connect/disconnect.
 * Never registers handlers.
 * Never dispatches redux.
 */

import { useEffect, useState } from "react";
import { getSignalingInstance } from "../signaling/signalingInstance";

export default function useSignalingCore() {
  const signaling = getSignalingInstance();
  const [connected, setConnected] = useState(signaling.isConnected);

  useEffect(() => {
    signaling.on("onConnected", () => setConnected(true));
    signaling.on("onDisconnected", () => setConnected(false));

    return () => {
      signaling.off("onConnected");
      signaling.off("onDisconnected");
    };
  }, [signaling]);

  return { signaling, connected };
}
