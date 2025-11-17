/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SignalingEvents {
  //
  // ─────────────────────────────────
  // TRANSPORT-LEVEL EVENTS
  // ─────────────────────────────────
  //

  /** Fired when socket.io successfully connects */
  onConnected?: () => void;

  /** Fired when socket.io disconnects */
  onDisconnected?: (reason: string) => void;

  /** Fired when socket.io encounters an error while connecting */
  onConnectError?: (error: unknown) => void;

  /** Fired during socket.io automatic reconnection attempts */
  onReconnectAttempt?: (attempt: number) => void;

  /** Fired when socket.io fails reconnecting after max attempts */
  onReconnectFailed?: () => void;

  //
  // ─────────────────────────────────
  // BUSINESS EVENTS
  // ─────────────────────────────────
  //

  /** Successfully registered user after initial connect */
  onRegisterSuccess?: (payload: { username: string }) => void;

  /** Server refused registration */
  onRegisterError?: (payload: { message: string }) => void;

  /** Full list of online users */
  onUsersUpdate?: (users: any[]) => void;

  /** A user just went online */
  onUserOnline?: (user: any) => void;

  /** A user went fully offline (socket closed) */
  onUserOffline?: (payload: { username: string }) => void;

  /** A user disconnected but not fully offline (your own event) */
  onUserDisconnected?: (payload: { username: string }) => void;

  /** A user reconnected (your server emits this) */
  onUserReconnected?: (payload: { username: string }) => void;

  /** WebRTC private signal for offers/answers/ice candidates */
  onPrivateSignal?: (payload: { fromUsername: string; signal: unknown }) => void;

  /** Typing indicator start */
  onTypingStart?: (payload: { fromUsername: string }) => void;

  /** Typing indicator stop */
  onTypingStop?: (payload: { fromUsername: string }) => void;
}
