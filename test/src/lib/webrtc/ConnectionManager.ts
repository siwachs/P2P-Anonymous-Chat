import { SignalingClient } from "@/lib/signaling/signalingClient";
import { nanoid } from "nanoid";

import {
  addConnection,
  removeConnection,
  updateConnectionState,
} from "@/lib/store/slices/connectionsSlice";
import {
  addMessage,
  updateMessageStatus,
} from "@/lib/store/slices/messagesSlice";

import type { AppStore } from "@/lib/store";
import type { Signal } from "@/types/webRtc";
import type { Message, PeerConnection, PeerConnectionState } from "./PeerConnection";

interface ConnectionManagerConfig {
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

export class ConnectionManager {
  private readonly connections: Map<string, PeerConnection> = new Map();
  private readonly reconnectAttempts: Map<string, number> = new Map();
  private readonly reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private readonly config: ConnectionManagerConfig;
  private readonly signalingClient: SignalingClient;
  private readonly store: AppStore;
  private isDestroyed: boolean = false;

  // Configuration with defaults
  private readonly RECONNECT_DELAY: number;
  private readonly MESSAGE_DELIVERY_DELAY: number;
  private readonly MAX_RECONNECT_ATTEMPTS: number;
  private readonly CONNECTION_TIMEOUT: number;

  constructor(config: ConnectionManagerConfig) {
    this.config = config;
    this.signalingClient = config.signalingClient;
    this.store = config.store;

    // Set configuration with defaults
    this.RECONNECT_DELAY = config.reconnectDelay || 5000;
    this.MESSAGE_DELIVERY_DELAY = config.messageDeliveryDelay || 100;
    this.MAX_RECONNECT_ATTEMPTS = config.maxReconnectAttempts || 5;
    this.CONNECTION_TIMEOUT = config.connectionTimeout || 20000;

    this.setupSignalingHandlers();
  }

  setupSignalingHandlers() {
    this.signalingClient.setEventHandlers({
      onPrivateSignal: ({ fromUsername, signal }) => {
        if (this.isDestroyed) return;

        this.handleIncomingSignal(fromUsername, signal as Signal);
      },

      onUserReconnected: ({ username }) => {
        if (this.isDestroyed) return;

        console.log(`User ${username} reconnected`);
        this.handleUserReconnected(username);
      },

      onUserDisconnected: ({ username }) => {
        if (this.isDestroyed) return;

        console.log(`User ${username} disconnected`);
        this.handleUserDisconnected(username);
      },

      onUserOffline: ({ username }) => {
        if (this.isDestroyed) return;

        console.log(`User ${username} went offline`);
        this.handleUserOffline(username);
      },
    });
  }

  private async handleIncomingSignal(fromUsername: string, signal: Signal) {
    let connection = this.connections.get(fromUsername);

    // Create connection if it doesn't exist and we received an offer
    if (!connection && signal.type === "offer")
      connection = await this.createConnection(fromUsername, false);

    if (connection) await connection.handleSignal(signal);
  }

  private handleUserReconnected(username: string) {
    this.reconnectAttempts.set(username, 0);

    if (this.connections.has(username)) {
      this.restartConnection(username);
    }
  }

  private handleUserDisconnected(username: string) {
    const connection = this.connections.get(username);

    if (connection) {
      this.store.dispatch(
        updateConnectionState({
          username,
          state: "disconnected",
        }),
      );
    }
  }

  private handleUserOffline(username: string) {
    // Clear any pending reconnect attempts
    this.clearReconnectTimeout(username);
    this.reconnectAttempts.delete(username);

    // Close connection if exists
    this.disconnectFromUser(username);
  }

  async connectToUser(targetUsername: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error("ConnectionManager has been destroyed");
    }

    // Validate input
    if (!targetUsername || targetUsername === this.config.currentUsername) {
      throw new Error("Invalid target username");
    }

    // Check if connection already exists
    const existingConnection = this.connections.get(targetUsername);
    if (existingConnection) {
      if (existingConnection.isConnected) {
        console.log(`Already connected to ${targetUsername}`);
        return;
      }

      // Close and remove existing failed connection
      existingConnection.close();
      this.connections.delete(targetUsername);
    }

    try {
      // Create new connection as initiator
      const connection = await this.createConnection(targetUsername, true);

      // Set connection timeout
      const timeoutId = setTimeout(() => {
        if (!connection.isConnected) {
          console.warn(`Connection to ${targetUsername} timed out`);
          this.handleConnectionError(
            targetUsername,
            new Error("Connection timeout"),
          );
        }
      }, this.CONNECTION_TIMEOUT);

      await connection.start();
      clearTimeout(timeoutId);
    } catch (error) {
      console.error(`Failed to connect to ${targetUsername}:`, error);
      this.handleConnectionError(targetUsername, error);
      throw error;
    }
  }

  private async createConnection(targetUsername: string, isInitiator: boolean) {
    const connection = new PeerConnection({
      username: this.config.currentUsername,
      targetUsername,
      isInitiator,
      onSignal: (signal: unknown) => {
        if (this.isDestroyed) return;

        const success = this.signalingClient.sendSignal(targetUsername, signal);
        if (!success) {
          console.warn(`Failed to send signal to ${targetUsername}`);
        }
      },
      onMessage: (message: Message) => {
        if (this.isDestroyed) return;

        this.handleMessage(targetUsername, message);
      },
      onTyping: (isTyping: boolean) => {
        if (this.isDestroyed) return;

        this.config.onTypingUpdate(targetUsername, isTyping);
      },
      onStateChange: (state: PeerConnectionState) => {
        if (this.isDestroyed) return;

        this.handleStateChange(targetUsername, state);
      },
      onError: (error: unknown) => {
        if (this.isDestroyed) return;

        console.error(`Connection error with ${targetUsername}:`, error);
        this.handleConnectionError(targetUsername, error);
      },
    });

    this.connections.set(targetUsername, connection);
    this.store.dispatch(
      addConnection({
        username: targetUsername,
        state: "connecting",
        isInitiator,
      }),
    );

    return connection;
  }

  private handleMessage(fromUsername: string, message: Message) {
    if (!message.text || typeof message.text !== "string") {
      console.warn(`Invalid message from ${fromUsername}:`, message);
      return;
    }

    const messageId = nanoid();

    this.store.dispatch(
      addMessage({
        id: messageId,
        conversationId: fromUsername,
        senderId: fromUsername,
        content: message.text,
        timestamp: message.timestamp || Date.now(),
        isEncrypted: true,
        status: "delivered",
      }),
    );
  }

  private handleStateChange(username: string, state: PeerConnectionState) {
    this.store.dispatch(updateConnectionState({ username, state }));

    switch (state) {
      case "connected":
        this.reconnectAttempts.set(username, 0);
        this.clearReconnectTimeout(username);
        console.log(`Successfully connected to ${username}`);
        break;

      case "failed":
      case "disconnected":
        this.scheduleReconnect(username);
        break;

      case "closed":
        this.clearReconnectTimeout(username);
        break;
    }
  }

  private handleConnectionError(username: string, error: unknown) {
    console.error(`Connection error with ${username}:`, error);

    this.store.dispatch(
      updateConnectionState({
        username,
        state: "failed",
      }),
    );

    this.scheduleReconnect(username);
  }

  private scheduleReconnect(username: string) {
    const currentAttempts = this.reconnectAttempts.get(username) || 0;

    if (currentAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.log(`Max reconnect attempts reached for ${username}`);
      this.disconnectFromUser(username);
      return;
    }

    this.clearReconnectTimeout(username);

    // Calculate delay with exponential backoff
    const delay = this.RECONNECT_DELAY * Math.pow(2, currentAttempts);

    console.log(
      `Scheduling reconnect to ${username} in ${delay}ms (attempt ${currentAttempts + 1})`,
    );

    const timeoutId = setTimeout(() => {
      if (!this.isDestroyed && this.connections.has(username)) {
        this.reconnectAttempts.set(username, currentAttempts + 1);
        this.restartConnection(username);
      }
    }, delay);

    this.reconnectTimeouts.set(username, timeoutId);
  }

  private clearReconnectTimeout(username: string) {
    const timeoutId = this.reconnectTimeouts.get(username);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.reconnectTimeouts.delete(username);
    }
  }

  private async restartConnection(username: string) {
    if (this.isDestroyed) return;

    const connection = this.connections.get(username);
    if (!connection) return;

    const wasInitiator = connection.isInitiator;

    try {
      // Close existing connection
      connection.close();
      this.connections.delete(username);

      // Create new connection
      const newConnection = await this.createConnection(username, wasInitiator);

      if (wasInitiator) {
        await newConnection.start();
      }
    } catch (error) {
      console.error(`Failed to restart connection to ${username}:`, error);
      this.handleConnectionError(username, error);
    }
  }

  sendMessage(targetUsername: string, message: string) {
    if (this.isDestroyed) {
      throw new Error("ConnectionManager has been destroyed");
    }

    // Validate input
    if (!message || typeof message !== "string") {
      throw new Error("Invalid message");
    }

    const connection = this.connections.get(targetUsername);
    if (!connection) {
      throw new Error(`No connection to ${targetUsername}`);
    }

    if (!connection.isConnected) {
      throw new Error(`Not connected to ${targetUsername}`);
    }

    const messageId = nanoid();
    this.store.dispatch(
      addMessage({
        id: messageId,
        conversationId: targetUsername,
        senderId: this.config.currentUsername,
        content: message,
        timestamp: Date.now(),
        isEncrypted: false,
        status: "pending",
      }),
    );

    try {
      // Send via P2P
      connection.sendMessage(message);

      // Update status after delivery delay
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.store.dispatch(
            updateMessageStatus({
              messageId,
              status: "sent",
            }),
          );
        }
      }, this.MESSAGE_DELIVERY_DELAY);
    } catch (error) {
      console.error(`Failed to send message to ${targetUsername}:`, error);

      // Update message status to failed
      this.store.dispatch(
        updateMessageStatus({
          messageId,
          status: "failed",
        }),
      );

      throw error;
    }

    return messageId;
  }

  sendTyping(targetUsername: string, isTyping: boolean) {
    if (this.isDestroyed) return false;

    const connection = this.connections.get(targetUsername);

    if (connection?.isConnected) {
      try {
        connection.sendTyping(isTyping);
        return true;
      } catch (error) {
        console.error(
          `Failed to send typing indicator to ${targetUsername}:`,
          error,
        );
        return false;
      }
    }

    return false;
  }

  disconnectFromUser(username: string) {
    if (this.isDestroyed) return;

    // Clear reconnect timeout
    this.clearReconnectTimeout(username);
    this.reconnectAttempts.delete(username);

    const connection = this.connections.get(username);
    if (connection) {
      connection.close();
      this.connections.delete(username);
      this.store.dispatch(removeConnection(username));
      console.log(`Disconnected from ${username}`);
    }
  }

  disconnectAll() {
    if (this.isDestroyed) return;

    console.log(`Disconnecting all ${this.connections.size} connections`);

    // Clear all timeouts
    this.reconnectTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.reconnectTimeouts.clear();
    this.reconnectAttempts.clear();

    // Close all connections
    this.connections.forEach((connection) => connection.close());
    this.connections.clear();
  }

  destroy() {
    if (this.isDestroyed) return;

    console.log("Destroying ConnectionManager");
    this.isDestroyed = true;

    // Disconnect all connections
    this.disconnectAll();

    this.signalingClient.setEventHandlers({
      onPrivateSignal: undefined,
      onUserReconnected: undefined,
      onUserDisconnected: undefined,
      onUserOffline: undefined,
    });
  }

  getConnection(username: string): PeerConnection | undefined {
    return this.isDestroyed ? undefined : this.connections.get(username);
  }

  getAllConnections(): Map<string, PeerConnection> {
    return this.isDestroyed ? new Map() : new Map(this.connections);
  }

  getConnectionState(username: string): PeerConnectionState | null {
    const connection = this.getConnection(username);
    return connection ? connection.connectionState : null;
  }

  isConnected(username: string): boolean {
    const connection = this.getConnection(username);
    return connection ? connection.isConnected : false;
  }

  getConnectionCount(): number {
    return this.isDestroyed ? 0 : this.connections.size;
  }

  get isAlive(): boolean {
    return !this.isDestroyed;
  }

  getStatus() {
    return {
      isDestroyed: this.isDestroyed,
      connectionCount: this.getConnectionCount(),
      reconnectAttempts: Object.fromEntries(this.reconnectAttempts),
      pendingReconnects: this.reconnectTimeouts.size,
    };
  }
}
