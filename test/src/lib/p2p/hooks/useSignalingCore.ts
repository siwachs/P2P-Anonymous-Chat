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
    signaling.setEventHandlers({
      ...signaling["eventHandlers"],
      onConnected: () => setConnected(true),
      onDisconnected: () => setConnected(false),
    });
  }, [signaling]);

  return { signaling, connected };
}
