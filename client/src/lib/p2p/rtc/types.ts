import type SignalingClient from "@/lib/p2p/signaling/SignalingClient";
import type { AppStore } from "@/lib/store";

export type PeerConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export interface Signal {
  type: "offer" | "answer" | "ice-candidate";
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface PeerConnectionConfig {
  username: string;
  targetUsername: string;
  isInitiator: boolean;
  iceServers?: RTCIceServer[];
  onSignal: (signal: unknown) => void;
}

export interface ConnectionManagerConfig {
  currentUsername: string;
  signalingClient: SignalingClient;
  store: AppStore;
  onTypingUpdate: (username: string, isTyping: boolean) => void;

  // Configuration options
  reconnectDelay?: number;
  messageDeliveryDelay?: number;
  maxReconnectAttempts?: number;
  connectionTimeout?: number;
}
