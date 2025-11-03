import { io, Socket } from "socket.io-client";

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
}

export class SignalingClient {
  private socket: Socket | null = null;
  private eventHandlers: SignalingEvents = {};
  private username: string | null = null;
  private isConnecting: boolean = false;

  // Set event handlers
  setEventHandlers(handlers: SignalingEvents) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // Set individual event handlers
  on<k extends keyof SignalingEvents>(event: k, handler: SignalingEvents[k]) {
    this.eventHandlers[event] = handler;
  }

  // Remove event handler
  off<k extends keyof SignalingEvents>(event: k) {
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

    if (this.socket?.connected && this.username === data.username)
      this.socket.disconnect();

    this.username = data.username;
    this.socket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: true,
    });

    this.setEventListeners();

    this.socket.on("connect", () => {
      console.log(`Connected to signaling server as ${data.username}`);
      this.isConnecting = false;
      this.socket?.emit("register", data);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from signaling server:", reason);
      this.isConnecting = false;

      if (reason === "io server disconnect") {
        this.socket?.connect();
      }
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect after all attempts");
      this.isConnecting = false;
      this.eventHandlers.onRegisterError?.({
        message:
          "Unable to connect to signaling server after multiple attempts. Please check your connection.",
      });
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error (Socket.IO will retry):", error);
    });
  }

  private setEventListeners() {
    if (!this.socket) return;

    // Remove existing listeners to prevent duplicates
    this.socket.off("register-success");
    this.socket.off("register-error");
    this.socket.off("users-list");
    this.socket.off("user-online");
    this.socket.off("user-offline");
    this.socket.off("user-reconnected");
    this.socket.off("user-disconnected");
    this.socket.off("signal-private");
    this.socket.off("typing-start");
    this.socket.off("typing-stop");
    this.socket.off("signal-error");
    this.socket.off("error");

    // Registration events
    this.socket.on("register-success", (data) => {
      console.log("Registered successfully:", data);
      this.isConnecting = false;
      this.eventHandlers.onRegisterSuccess?.(data);
    });

    this.socket.on("register-error", (error) => {
      console.error("Registration failed:", error);
      this.isConnecting = false;
      this.eventHandlers.onRegisterError?.(error);
    });

    // User events
    this.socket.on("users-list", (users) => {
      this.eventHandlers.onUsersUpdate?.(users);
    });

    this.socket.on("user-online", (data) => {
      this.eventHandlers.onUserOnline?.(data);
    });

    this.socket.on("user-offline", (data) => {
      this.eventHandlers.onUserOffline?.(data);
    });

    this.socket.on("user-reconnected", (data) => {
      console.log("User reconnected:", data.username);
      this.eventHandlers.onUserReconnected?.(data);
    });

    this.socket.on("user-disconnected", (data) => {
      console.log("User disconnected:", data.username);
      this.eventHandlers.onUserDisconnected?.(data);
    });

    // Signaling
    this.socket.on("signal-private", (data) => {
      this.eventHandlers.onPrivateSignal?.(data);
    });

    // Typing
    this.socket.on("typing-start", (data) => {
      this.eventHandlers.onTypingStart?.(data);
    });

    this.socket.on("typing-stop", (data) => {
      this.eventHandlers.onTypingStop?.(data);
    });

    // Error handling
    this.socket.on("signal-error", (error) => {
      console.error("Signal error:", error);
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  // Send Signal to a user by username
  sendSignal(toUsername: string, signal: unknown) {
    if (!this.socket?.connected) {
      console.warn("Cannot send signal: not connected");
      return false;
    }

    this.socket?.emit("signal-private", { toUsername, signal });
    return true;
  }

  // Typing indicators by username
  startTyping(toUsername: string) {
    if (!this.socket?.connected) return false;

    this.socket?.emit("typing-start", toUsername);
    return true;
  }

  stopTyping(toUsername: string) {
    if (!this.socket?.connected) return false;
    this.socket?.emit("typing-stop", toUsername);

    return true;
  }

  // Room operations
  joinRoom(roomId: string) {
    if (!this.socket?.connected) return false;
    this.socket?.emit("join-room", roomId);

    return true;
  }

  leaveRoom(roomId: string) {
    if (!this.socket?.connected) return false;
    this.socket?.emit("leave-room", roomId);

    return true;
  }

  disconnect() {
    this.isConnecting = false;

    if (this.socket) {
      this.socket.disconnect();
      this.socket.off();
      this.socket = null;
    }

    this.username = null;
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get currentUsername(): string | null {
    return this.username;
  }

  get connectionState(): "disconnected" | "connecting" | "connected" {
    if (this.isConnecting) return "connecting";
    if (this.socket?.connected) return "connected";
    return "disconnected";
  }
}
