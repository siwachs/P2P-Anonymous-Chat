import { io, Socket } from "socket.io-client";

import type { SignalingEvents } from "./signalingTypes";
import type { UserInfo } from "@/types/user";
import {
  SOCKET_RECONNECTION_DELAY,
  SOCKET_RECONNECTION_DELAY_MAX,
  SOCKET_RECONNECTION_ATTEMPT_MAX,
  SOCKET_TIMEOUT,
} from "./constants";

/**
 * SignalingClient
 * --------------------
 * A clean abstraction on top of socket.io.
 *
 * ✔ Does NOT leak the socket instance.
 * ✔ Exposes transport + business events via public API.
 * ✔ Prevents duplicate listeners.
 * ✔ Manages reconnects, errors, and registration.
 */
export default class SignalingClient {
  private socket: Socket | null = null;
  private handlers: SignalingEvents = {};
  private username: string | null = null;
  private isConnecting = false;
  
  on<K extends keyof SignalingEvents>(event: K, cb: SignalingEvents[K]) {
    this.handlers[event] = cb;
  }

  off<K extends keyof SignalingEvents>(event: K) {
    delete this.handlers[event];
  }

  connect(
    user: Omit<UserInfo, "id" | "createdAt" | "expiresAt">,
    serverUrl: string = import.meta.env.VITE_SIGNALING_URL
  ) {
    if (
      this.isConnecting ||
      (this.socket?.connected && this.username === user.username)
    )
      return;

    this.isConnecting = true;
    this.username = user.username;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: SOCKET_RECONNECTION_DELAY,
      reconnectionDelayMax: SOCKET_RECONNECTION_DELAY_MAX,
      reconnectionAttempts: SOCKET_RECONNECTION_ATTEMPT_MAX,
      timeout: SOCKET_TIMEOUT,
      forceNew: true,
    });

    this.attachSocketEvents(user);
  }

  private attachSocketEvents(
    user: Omit<UserInfo, "id" | "createdAt" | "expiresAt">
  ) {
    if (!this.socket) return;

    const s = this.socket;

    s.removeAllListeners();

    // ---------------------
    // TRANSPORT-LEVEL EVENTS
    // ---------------------
    s.on("connect", () => {
      this.isConnecting = false;
      this.handlers.onConnected?.();
      s.emit("register", user);
    });

    s.on("disconnect", (reason) => {
      this.isConnecting = false;
      this.handlers.onDisconnected?.(reason);
    });

    s.on("connect_error", (error) => {
      this.handlers.onConnectError?.(error);
    });

    s.on("reconnect_attempt", (attempt) => {
      this.handlers.onReconnectAttempt?.(attempt);
    });

    s.on("reconnect_failed", () => {
      this.handlers.onReconnectFailed?.();
    });

    // ---------------------
    // BUSINESS EVENTS
    // ---------------------
    s.on("register-success", (payload) => {
      this.handlers.onRegisterSuccess?.(payload);
    });

    s.on("register-error", (error) => {
      this.handlers.onRegisterError?.(error);
    });

    s.on("users-list", (users) => {
      this.handlers.onUsersUpdate?.(users);
    });

    s.on("user-online", (user) => {
      this.handlers.onUserOnline?.(user);
    });

    s.on("user-offline", (data) => {
      this.handlers.onUserOffline?.(data);
    });

    s.on("user-reconnected", (data) => {
      this.handlers.onUserReconnected?.(data);
    });

    s.on("user-disconnected", (data) => {
      this.handlers.onUserDisconnected?.(data);
    });

    s.on("signal-private", (data) => {
      this.handlers.onPrivateSignal?.(data);
    });

    s.on("typing-start", (data) => {
      this.handlers.onTypingStart?.(data);
    });

    s.on("typing-stop", (data) => {
      this.handlers.onTypingStop?.(data);
    });
  }

  sendSignal(toUsername: string, signal: unknown) {
    if (!this.socket?.connected) return false;

    this.socket.emit("signal-private", { toUsername, signal });
    return true;
  }

  startTyping(toUsername: string) {
    if (!this.socket?.connected) return false;

    this.socket.emit("typing-start", toUsername);
    return true;
  }

  stopTyping(toUsername: string) {
    if (!this.socket?.connected) return false;

    this.socket.emit("typing-stop", toUsername);
    return true;
  }

  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;

    this.isConnecting = false;
    this.username = null;
  }

  get isConnected() {
    return this.socket?.connected || false;
  }

  get connectionState(): "disconnected" | "connecting" | "connected" {
    if (this.isConnecting) return "connecting";
    if (this.socket?.connected) return "connected";
    return "disconnected";
  }

  get currentUsername(): string | null {
    return this.username;
  }
}
