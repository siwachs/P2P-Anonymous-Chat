import { io, Socket } from "socket.io-client";

import { OnlineUser } from "@/types/onlineUser";
import { Age, Gender } from "@/types/user";

interface SignalingEvents {
  onUsersUpdate?: (users: Array<OnlineUser>) => void;
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
    data: {
      username: string;
      age: Age;
      gender: Gender;
      country: string;
      interests: string[];
    },
    serverUrl: string = process.env.NEXT_PUBLIC_SIGNALING_URL as string,
  ) {
    if (this.socket?.connected) this.socket.disconnect();

    this.username = data.username;
    this.socket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      console.log("Connected to signaling server");
      this.socket?.emit("register", data);
    });

    // Registration events
    this.socket.on("register-success", (data) => {
      console.log("Registered successfully:", data);
      this.eventHandlers.onRegisterSuccess?.(data);
    });

    this.socket.on("register-error", (error) => {
      console.error("Registration failed:", error);
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
    this.socket?.emit("signal-private", { toUsername, signal });
  }

  // Typing indicators by username
  startTyping(toUsername: string) {
    this.socket?.emit("typing-start", toUsername);
  }

  stopTyping(toUsername: string) {
    this.socket?.emit("typing-stop", toUsername);
  }

  // Room operations
  joinRoom(roomId: string) {
    this.socket?.emit("join-room", roomId);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit("leave-room", roomId);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.username = null;
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get currentUsername(): string | null {
    return this.username;
  }
}
