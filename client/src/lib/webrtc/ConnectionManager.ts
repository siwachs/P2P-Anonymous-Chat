import { SignalingClient } from "@/lib/signaling/signalingClient";
import { AppStore } from "@/lib/store";

import {
  addConnection,
  removeConnection,
  updateConnectionState,
} from "@/lib/store/slices/connectionsSlice";
import {
  addMessage,
  updateMessageStatus,
} from "@/lib/store/slices/messagesSlice";

import { Signal } from "@/types/webRtc";
import { Message, PeerConnection, PeerConnectionState } from "./PeerConnection";

interface ConnectionManagerConfig {
  currentUsername: string;
  signalingClient: SignalingClient;
  store: AppStore;
  onTypingUpdate: (username: string, isTyping: boolean) => void;
}

export class ConnectionManager {
  private readonly connections: Map<string, PeerConnection> = new Map();
  private readonly config: ConnectionManagerConfig;
  private readonly signalingClient: SignalingClient;
  private readonly store: AppStore;

  constructor(config: ConnectionManagerConfig) {
    this.config = config;
    this.signalingClient = config.signalingClient;
    this.store = config.store;
    this.setupSignalingHandlers();
  }

  private setupSignalingHandlers() {
    // Set up event handlers on the signaling client
    this.signalingClient.on("onPrivateSignal", ({ fromUsername, signal }) => {
      this.handleIncomingSignal(fromUsername, signal as Signal);
    });

    this.signalingClient.on("onUserReconnected", ({ username }) => {
      console.log(`User ${username} reconnected`);
      if (this.connections.has(username)) {
        this.restartConnection(username);
      }
    });

    this.signalingClient.on("onUserDisconnected", ({ username }) => {
      console.log(`User ${username} disconnected`);
      const connection = this.connections.get(username);

      if (connection) {
        this.store.dispatch(
          updateConnectionState({
            username,
            state: "disconnected",
          }),
        );
      }
    });
  }

  // Alternative approach: Set all handlers at once
  setupHandlers() {
    this.signalingClient.setEventHandlers({
      onPrivateSignal: ({ fromUsername, signal }) => {
        this.handleIncomingSignal(fromUsername, signal as Signal);
      },
      onUserReconnected: ({ username }) => {
        console.log(`User ${username} reconnected`);
        if (this.connections.has(username)) {
          this.restartConnection(username);
        }
      },
      onUserDisconnected: ({ username }) => {
        console.log(`User ${username} disconnected`);
        const connection = this.connections.get(username);
        if (connection) {
          this.store.dispatch(
            updateConnectionState({
              username,
              state: "disconnected",
            }),
          );
        }
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

  async connectToUser(targetUsername: string): Promise<void> {
    // Check if connection already exists
    if (this.connections.has(targetUsername)) {
      const existing = this.connections.get(targetUsername)!;

      if (existing.isConnected) {
        return console.log(
          `Already connected to ${targetUsername} with encryption`,
        );
      }
    }

    // Create new connection as initiator
    const connection = await this.createConnection(targetUsername, true);
    await connection.start();
  }

  private async createConnection(targetUsername: string, isInitiator: boolean) {
    const connection = new PeerConnection({
      username: this.config.currentUsername,
      targetUsername,
      isInitiator,
      onSignal: (signal: unknown) => {
        this.signalingClient.sendSignal(targetUsername, signal);
      },
      onMessage: (message: Message) => {
        this.handleMessage(targetUsername, message);
      },
      onTyping: (isTyping: boolean) => {
        this.config.onTypingUpdate(targetUsername, isTyping);
      },
      onStateChange: (state: PeerConnectionState) => {
        this.handleStateChange(targetUsername, state);
      },
      onError: (error: unknown) => {
        console.error(`Connection error with ${targetUsername}:`, error);
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
    const messageId = `${Date.now()}-${Math.random()}`;

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

    // Handle connection failures
    if (state === "failed") {
      setTimeout(() => {
        this.restartConnection(username);
      }, 5000);
    }
  }

  private async restartConnection(username: string) {
    const connection = this.connections.get(username);
    if (!connection) return;

    const wasInitiator = connection.isInitiator;
    connection.close();
    this.connections.delete(username);

    // Recreate connection
    const newConnection = await this.createConnection(username, wasInitiator);
    if (wasInitiator) {
      await newConnection.start();
    }
  }

  sendMessage(targetUsername: string, message: string) {
    const connection = this.connections.get(targetUsername);
    if (!connection) {
      throw new Error(`No connection to ${targetUsername}`);
    }

    const messageId = `${Date.now()}-${Math.random()}`;
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

    // Send via P2P
    connection.sendMessage(message);

    // Update status after a short delay (simulate delivery)
    setTimeout(() => {
      this.store.dispatch(
        updateMessageStatus({
          messageId,
          status: "sent",
        }),
      );
    }, 100);
  }

  sendTyping(targetUsername: string, isTyping: boolean) {
    const connection = this.connections.get(targetUsername);
    if (connection?.isConnected) {
      connection.sendTyping(isTyping);
    }
  }

  disconnectFromUser(username: string) {
    const connection = this.connections.get(username);
    if (connection) {
      connection.close();
      this.connections.delete(username);
      this.store.dispatch(removeConnection(username));
    }
  }

  disconnectAll() {
    this.connections.forEach((connection) => connection.close());
    this.connections.clear();
  }

  getConnection(username: string): PeerConnection | undefined {
    return this.connections.get(username);
  }

  getAllConnections(): Map<string, PeerConnection> {
    return new Map(this.connections);
  }
}
