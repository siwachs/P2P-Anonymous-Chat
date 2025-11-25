import { P2P_CONFIG } from "../config/p2p.config";

export const SOCKET_RECONNECTION_DELAY = P2P_CONFIG.signaling.reconnectDelay;
export const SOCKET_RECONNECTION_DELAY_MAX =
  P2P_CONFIG.signaling.reconnectDelayMax;
export const SOCKET_RECONNECTION_ATTEMPT_MAX = P2P_CONFIG.signaling.maxAttempts;
export const SOCKET_TIMEOUT = P2P_CONFIG.signaling.timeout;
