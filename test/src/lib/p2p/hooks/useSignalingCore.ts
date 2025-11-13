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
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
  }, [signaling]);

  return { signaling, connected };
}
