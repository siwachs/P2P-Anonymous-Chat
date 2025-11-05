import { io, Socket } from "socket.io-client";

import {
  SOCKET_RECONNECTION_DELAY,
  SOCKET_RECONNECTION_DELAY_MAX,
  SOCKET_RECONNECTION_ATTEMPT_MAX,
  SOCKET_TIMEOUT,
} from "@/lib/constants";
import type { OnlineUser } from "@/types/onlineUser";
import type { UserInfo } from "@/types/user";

interface SignalingEvents {
  onUsersUpdate?: (users: OnlineUser[]) => void;
  onUserOnline?: (data: OnlineUser) => void;
  onUserOffline?: (data: { username: string }) => void;
  onUserReconnected?: (data: { username: string }) => void;
  onUserDisconnected?: (data: { username: string }) => void;
  onPrivateSignal?: (data: { fromUsername: string; signal: unknown }) => void;
  onTypingStart?: (data: { fromUsername: string }) => void;
  onTypingStop?: (data: { fromUsername: string }) => void;
  onRegisterSuccess?: (data: { username: string }) => void;
  onRegisterError?: (error: { message: string }) => void;
  onReconnectAttempt?: (attempt: number) => void;
  onReconnectFailed?: () => void;
  onConnectError?: (error: Error) => void;
}

export class SignalingClient {
  private socket: Socket | null = null;
  private eventHandlers: SignalingEvents = {};
  private username: string | null = null;
  private isConnecting = false;

  setEventHandlers(handlers: SignalingEvents) {
    this.eventHandlers = handlers;
  }

  on<K extends keyof SignalingEvents>(event: K, handler: SignalingEvents[K]) {
    this.eventHandlers[event] = handler;
  }

  off<K extends keyof SignalingEvents>(event: K) {
    delete this.eventHandlers[event];
  }

  connect(
    data: Omit<UserInfo, "id" | "createdAt" | "expiresAt">,
    serverUrl: string = import.meta.env.VITE_SIGNALING_URL
  ) {
    if (
      this.isConnecting ||
      (this.socket?.connected && this.username === data.username)
    )
      return;

    this.isConnecting = true;
    this.username = data.username;

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

    this.registerSocketEvents(data);
  }

  private registerSocketEvents(
    data: Omit<UserInfo, "id" | "createdAt" | "expiresAt">
  ) {
    if (!this.socket) return;

    const s = this.socket;
    
    s.removeAllListeners();

    s.on("connect", () => {
      this.isConnecting = false;
      s.emit("register", data);
    });

    s.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnecting = false;
    });

    s.on("reconnect_attempt", (attempt) => {
      this.eventHandlers.onReconnectAttempt?.(attempt);
    });

    s.on("reconnect_failed", () => {
      this.eventHandlers.onReconnectFailed?.();
    });

    s.on("connect_error", (error) => {
      this.eventHandlers.onConnectError?.(error);
    });

    s.on("register-success", (payload) => {
      this.eventHandlers.onRegisterSuccess?.(payload);
    });

    s.on("register-error", (error) => {
      this.eventHandlers.onRegisterError?.(error);
    });

    // User and signaling events
    s.on("users-list", (users) => this.eventHandlers.onUsersUpdate?.(users));
    s.on("user-online", (user) => this.eventHandlers.onUserOnline?.(user));
    s.on("user-offline", (data) => this.eventHandlers.onUserOffline?.(data));
    s.on("user-reconnected", (data) =>
      this.eventHandlers.onUserReconnected?.(data)
    );
    s.on("user-disconnected", (data) =>
      this.eventHandlers.onUserDisconnected?.(data)
    );
    s.on("signal-private", (data) =>
      this.eventHandlers.onPrivateSignal?.(data)
    );
    s.on("typing-start", (data) => this.eventHandlers.onTypingStart?.(data));
    s.on("typing-stop", (data) => this.eventHandlers.onTypingStop?.(data));
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
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
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
