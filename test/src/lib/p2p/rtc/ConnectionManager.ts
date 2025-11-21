import PeerConnection from "./PeerConnection";
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
import type { Signal } from "./types";
import type { Message } from "@/types/message";
import type SignalingClient from "../signaling/SignalingClient";
import type PeerConnectionType from "./PeerConnection";
import type { ConnectionManagerConfig } from "./types";
import type { PeerConnectionState } from "./types";
import {
  RTC_RECONNECT_DELAY,
  MESSAGE_DELIVERY_DELAY,
  RTC_MAX_RECONNECT_ATTEMPT,
  RTC_CONNECTION_TIMEOUT,
} from "./constants";

/**
 * ConnectionManager
 * ------------------
 * Manages all WebRTC PeerConnections for the current user.
 *
 * Handles offers/answers/ICE
 * Manages reconnect attempts
 * Forwards typing events
 * Sends messages
 * Handles restart logic
 * Dispatches Redux updates
 */
export default class ConnectionManager {
  // RTC peers
  private readonly connections: Map<string, PeerConnectionType> = new Map();
  // Retry system
  private readonly reconnectAttempts: Map<string, number> = new Map();
  private readonly reconnectTimeouts: Map<
    string,
    ReturnType<typeof setTimeout>
  > = new Map();

  // Core config
  private readonly config: ConnectionManagerConfig;
  private readonly signalingClient: SignalingClient;
  private readonly store: AppStore;

  private isDestroyed = false;

  // Configuration with defaults
  private readonly RECONNECT_DELAY: number;
  private readonly MESSAGE_DELIVERY_DELAY: number;
  private readonly MAX_RECONNECT_ATTEMPTS: number;
  private readonly TIMEOUT: number;

  constructor(config: ConnectionManagerConfig) {
    this.config = config;
    this.signalingClient = config.signalingClient;
    this.store = config.store;

    // Set configuration with defaults
    this.RECONNECT_DELAY = config.reconnectDelay || RTC_RECONNECT_DELAY;
    this.MESSAGE_DELIVERY_DELAY =
      config.messageDeliveryDelay || MESSAGE_DELIVERY_DELAY;
    this.MAX_RECONNECT_ATTEMPTS =
      config.maxReconnectAttempts || RTC_MAX_RECONNECT_ATTEMPT;
    this.TIMEOUT = config.connectionTimeout || RTC_CONNECTION_TIMEOUT;

    this.bindSignalingEvents();
  }

  /**
   * Wire up signaling events → RTC workflow
   */
  bindSignalingEvents() {
    const client = this.signalingClient;

    client.on("onPrivateSignal", ({ fromUsername, signal }) => {
      if (!this.isDestroyed) {
        this.incomingSignal(fromUsername, signal as Signal);
      }
    });

    client.on("onUserReconnected", ({ username }) => {
      if (!this.isDestroyed) {
        this.userReconnected(username);
      }
    });

    client.on("onUserDisconnected", ({ username }) => {
      if (!this.isDestroyed) {
        this.userDisconnected(username);
      }
    });

    client.on("onUserOffline", ({ username }) => {
      if (!this.isDestroyed) {
        this.userOffline(username);
      }
    });
  }

  // ---------------------------------------------------------
  // SIGNAL HANDLING
  // ---------------------------------------------------------
  private async incomingSignal(fromUsername: string, signal: Signal) {
    let connection = this.connections.get(fromUsername);

    // Auto-create connection if needed (for "offer")
    if (!connection && signal.type === "offer") {
      connection = await this.createConnection(fromUsername, false);
    }

    if (connection) {
      await connection.handleSignal(signal);
    }
  }

  private userReconnected(username: string) {
    this.reconnectAttempts.set(username, 0);

    if (this.connections.has(username)) {
      this.restartConnection(username);
    }
  }

  private userDisconnected(username: string) {
    const connection = this.connections.get(username);
    if (!connection) return;

    this.store.dispatch(
      updateConnectionState({
        username,
        state: "disconnected",
      })
    );
  }

  private userOffline(username: string) {
    // Clear any pending reconnect attempts
    this.clearReconnectTimeout(username);

    this.reconnectAttempts.delete(username);
    // Close connection if exists
    this.disconnectFromUser(username);
  }

  // ---------------------------------------------------------
  // CREATE / CONNECT
  // ---------------------------------------------------------
  async connectToUser(targetUsername: string): Promise<void> {
    if (this.isDestroyed)
      throw new Error("ConnectionManager has been destroyed");

    // Validate input
    if (!targetUsername || targetUsername === this.config.currentUsername) {
      throw new Error("Invalid target username");
    }

    // Check if connection already exists
    const existing = this.connections.get(targetUsername);
    if (existing) {
      if (existing.isConnected) return;

      // Close and remove existing failed connection
      existing.close();
      this.connections.delete(targetUsername);
    }

    try {
      // Create new connection as initiator
      const connection = await this.createConnection(targetUsername, true);

      // Set connection timeout
      const timeoutId = setTimeout(() => {
        if (!connection.isConnected) {
          this.connectionError(targetUsername, new Error("Connection timeout"));
        }
      }, this.TIMEOUT);

      await connection.start();
      clearTimeout(timeoutId);
    } catch (error) {
      this.connectionError(targetUsername, error);
      throw error;
    }
  }

  private async createConnection(
    targetUsername: string,
    isInitiator: boolean
  ): Promise<PeerConnection> {
    const connection = new PeerConnection({
      username: this.config.currentUsername,
      targetUsername,
      isInitiator,
      onSignal: (signal) => {
        if (this.isDestroyed) return;

        const ok = this.signalingClient.sendSignal(targetUsername, signal);

        if (!ok) {
          console.warn(`Failed to send signal to ${targetUsername}`);
        }
      },
    });

    // Bind RTC events
    connection.on("message", (message: Message) =>
      this.handleMessage(targetUsername, message)
    );

    connection.on("typing", (isTyping: boolean) =>
      this.config.onTypingUpdate(targetUsername, isTyping)
    );

    connection.on("stateChange", (state: PeerConnectionState) =>
      this.stateChange(targetUsername, state)
    );

    connection.on("error", (error: Error) =>
      this.connectionError(targetUsername, error)
    );

    this.connections.set(targetUsername, connection);

    this.store.dispatch(
      addConnection({
        username: targetUsername,
        state: "connecting",
        isInitiator,
      })
    );

    return connection;
  }

  // ---------------------------------------------------------
  // MESSAGE / TYPING FLOW
  // ---------------------------------------------------------
  private handleMessage(fromUsername: string, message: Message) {
    if (!message || typeof message.content !== "string") {
      console.warn(`Invalid message from ${fromUsername}:`, message);
      return;
    }

    const messageId = nanoid();

    this.store.dispatch(
      addMessage({
        id: messageId,
        conversationId: fromUsername,
        senderId: fromUsername,
        content: message.content,
        type: message.type,
        timestamp: message.timestamp || Date.now(),
        isEncrypted: true,
        status: "delivered",
      })
    );
  }

  sendMessage(
    targetUsername: string,
    content: string,
    type: Message["type"] = "text",
    metadata?: Message["metadata"]
  ) {
    if (this.isDestroyed) {
      throw new Error("ConnectionManager has been destroyed");
    }

    if (!content || typeof content !== "string") {
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
        content,
        type,
        metadata,
        timestamp: Date.now(),
        isEncrypted: true,
        status: "pending",
      })
    );

    try {
      // Send via P2P
      connection.sendMessage(content, type, metadata);

      // Update status after delivery delay
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.store.dispatch(
            updateMessageStatus({
              messageId,
              status: "sent",
            })
          );
        }
      }, this.MESSAGE_DELIVERY_DELAY);
    } catch (error) {
      this.store.dispatch(
        updateMessageStatus({
          messageId,
          status: "failed",
        })
      );

      throw error;
    }

    return messageId;
  }

  sendTyping(targetUsername: string, isTyping: boolean) {
    if (this.isDestroyed) return false;

    const connection = this.connections.get(targetUsername);
    if (!connection?.isConnected) return false;

    try {
      connection.sendTyping(isTyping);
      return true;
    } catch (error) {
      console.error(
        `Failed to send typing indicator to ${targetUsername}:`,
        error
      );
      return false;
    }
  }

  // ---------------------------------------------------------
  // STATE / RECONNECT
  // ---------------------------------------------------------
  private stateChange(username: string, state: PeerConnectionState) {
    this.store.dispatch(updateConnectionState({ username, state }));

    switch (state) {
      case "connected":
        this.reconnectAttempts.set(username, 0);
        this.clearReconnectTimeout(username);
        break;

      case "failed":
      case "disconnected":
        this.scheduleReconnect(username);
        break;

      case "closed":
        this.clearReconnectTimeout(username);
        break;
      default:
        console.warn("ConnectionManager: unknown state", state);
    }
  }

  private connectionError(username: string, error: unknown) {
    console.error(`Connection error with ${username}:`, error);

    this.store.dispatch(
      updateConnectionState({
        username,
        state: "failed",
      })
    );

    this.scheduleReconnect(username);
  }

  private scheduleReconnect(username: string) {
    const currentAttempts = this.reconnectAttempts.get(username) || 0;

    if (currentAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.disconnectFromUser(username);
      return;
    }

    this.clearReconnectTimeout(username);

    // Calculate delay with exponential backoff
    const delay = this.RECONNECT_DELAY * Math.pow(2, currentAttempts);

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
      this.reconnectAttempts.delete(username);
    }
  }

  private async restartConnection(username: string) {
    if (this.isDestroyed) return;

    const oldConnection = this.connections.get(username);
    if (!oldConnection) return;

    const wasInitiator = oldConnection.isInitiator;

    try {
      // Close existing connection
      oldConnection.close();
      this.connections.delete(username);

      // Create new connection
      const newConnection = await this.createConnection(username, wasInitiator);

      if (wasInitiator) {
        await newConnection.start();
      }
    } catch (error) {
      this.connectionError(username, error);
    }
  }

  // ---------------------------------------------------------
  // DISCONNECT / DESTROY
  // ---------------------------------------------------------
  disconnectFromUser(username: string) {
    if (this.isDestroyed) return;

    this.clearReconnectTimeout(username);
    this.reconnectAttempts.delete(username);

    const connection = this.connections.get(username);
    if (!connection) return;

    connection.close();
    this.connections.delete(username);
    this.store.dispatch(removeConnection(username));
  }

  disconnectAll() {
    if (this.isDestroyed) return;

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

    this.isDestroyed = true;

    // Disconnect all connections
    this.disconnectAll();

    // Remove signaling handlers
    this.signalingClient.off("onPrivateSignal");
    this.signalingClient.off("onUserReconnected");
    this.signalingClient.off("onUserDisconnected");
    this.signalingClient.off("onUserOffline");
  }

  // ---------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------
  getConnection(username: string): PeerConnection | undefined {
    return this.isDestroyed ? undefined : this.connections.get(username);
  }

  getAllConnections(): Map<string, PeerConnection> {
    return this.isDestroyed ? new Map() : new Map(this.connections);
  }

  getConnectionState(username: string): PeerConnectionState | null {
    return this.connections.get(username)?.connectionState || null;
  }

  isConnected(username: string): boolean {
    return this.connections.get(username)?.isConnected || false;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  get isAlive(): boolean {
    return !this.isDestroyed;
  }

  getStatus() {
    return {
      isDestroyed: this.isDestroyed,
      connectionCount: this.connections.size,
      reconnectAttempts: Object.fromEntries(this.reconnectAttempts),
      pendingReconnects: this.reconnectTimeouts.size,
    };
  }
}
