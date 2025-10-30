import type { PeerConnectionState } from "@/lib/webrtc/PeerConnection";

export interface ConnectionInfo {
  username: string;
  state: PeerConnectionState;
  isInitiator: boolean;
  connectedAt?: number;
}

export interface ConnectionState {
  connections: Record<string, ConnectionInfo>;
  activeConnection: string | null;
}
