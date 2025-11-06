import type { Message } from "./message";
import type { SignalingClient } from "@/lib/signaling/signalingClient";
import type { AppStore } from "@/lib/store";

export type PeerConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export interface PeerConnectionConfig {
  username: string;
  targetUsername: string;
  isInitiator: boolean;
  iceServers?: RTCIceServer[];
  onSignal: (signal: unknown) => void;
  onMessage: (message: Message) => void;
  onTyping: (isTyping: boolean) => void;
  onStateChange: (state: PeerConnectionState) => void;
  onError: (error: Error) => void;
}

export interface Signal {
  type: string;
  offer: RTCSessionDescriptionInit;
  answer: RTCSessionDescriptionInit;
  candidate: RTCIceCandidateInit;
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