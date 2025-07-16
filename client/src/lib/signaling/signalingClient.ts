import { io, Socket } from "socket.io-client";

interface SignalingEvents {
  onUsersUpdate?: (users: Array<{ username: string; status: string }>) => void;
  onUserOnline?: (data: { username: string }) => void;
  onUserOffline?: (data: { username: string }) => void;
  onUserReconnected?: (data: { username: string }) => void;
  onUserDisconnected?: (data: { username: string }) => void;
  onPrivateSignal?: (data: { fromUsername: string; signal: unknown }) => void;
  onTypingStart?: (data: { fromUsername: string }) => void;
  onTypingStop?: (data: { fromUsername: string }) => void;
  onRegisterSuccess?: (data: {
    username: string;
    activeConnections: string[];
  }) => void;
  onRegisterError?: (error: { message: string }) => void;
}

export class SignalingClient {
  private socket: Socket | null = null;
  private events: SignalingEvents;
  private username: string | null = null;

  constructor(events: SignalingEvents = {}) {
    this.events = events;
  }

  connect(
    username: string,
    serverUrl: string = process.env.NEXT_PUBLIC_SERVER_URL as string,
  ) {
    if (this.socket?.connected) this.socket.disconnect();

    this.username = username;
    this.socket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      this.socket?.emit("register", { username });
    });

    // Registration events
    this.socket.on("register-success", (data) => {
      this.events.onRegisterSuccess?.(data);
    });

    this.socket.on("register-error", (error) => {
      this.events.onRegisterError?.(error);
    });

    // User events
    this.socket.on("users-list", (users) => {
      this.events.onUsersUpdate?.(users);
    });

    this.socket.on("user-online", (data) => {
      this.events.onUserOnline?.(data);
    });

    this.socket.on("user-offline", (data) => {
      this.events.onUserOffline?.(data);
    });

    this.socket.on("user-reconnected", (data) => {
      this.events.onUserReconnected?.(data);
    });

    this.socket.on("user-disconnected", (data) => {
      this.events.onUserDisconnected?.(data);
    });

    // Signaling
    this.socket.on("signal-private", (data) => {
      this.events.onPrivateSignal?.(data);
    });

    // Typing
    this.socket.on("typing-start", (data) => {
      this.events.onTypingStart?.(data);
    });

    this.socket.on("typing-stop", (data) => {
      this.events.onTypingStop?.(data);
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
