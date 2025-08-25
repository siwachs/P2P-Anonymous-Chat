import { EventEmitter } from "events";

export interface Message {
  text: string;
  timestamp: number;
}

export interface PeerConnectionConfig {
  username: string;
  targetUsername: string;
  isInitiator: boolean;
  iceServers?: RTCIceServer[];
  onSignal: (signal: unknown) => void;
  onMessage: (message: Message) => void;
  onTyping: (isTyping: boolean) => void;
  onStateChange: (state: PeerConnectionState) => void;
  onError: (error: Error) => void;
}

export type PeerConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export class PeerConnection extends EventEmitter {
  private pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private readonly config: PeerConnectionConfig;
  private state: PeerConnectionState = "new";
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageQueue: unknown[] = [];
  private lastMessageTime: number = 0;

  constructor(config: PeerConnectionConfig) {
    super();
    this.config = config;

    // Create RTCPeerConnection
    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers || [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    this.setupPeerConnection();

    if (config.isInitiator) this.createDataChannel();
  }

  private setupPeerConnection() {
    // ICE candidate handling
    this.pc.onicecandidate = (event) => {
      if (event.candidate)
        this.config.onSignal({
          type: "ice-candidate",
          candidate: event.candidate,
        });
    };

    // Connection state monitoring
    this.pc.onconnectionstatechange = () => {
      console.log(`Connection state: ${this.pc.connectionState}`);

      switch (this.pc.connectionState) {
        case "connected":
          this.updateState("connected");
          this.flushMessageQueue();
          break;
        case "disconnected":
          this.updateState("disconnected");
          this.scheduleReconnect();
          break;
        case "failed":
          this.updateState("failed");
          this.scheduleReconnect();
          break;
        case "closed":
          this.updateState("closed");
          break;
      }
    };

    // Data channel for non-initiator
    this.pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };
  }

  private createDataChannel() {
    this.dataChannel = this.pc.createDataChannel("chat", {
      ordered: true,
      maxRetransmits: 3,
    });
    this.setupDataChannel(this.dataChannel);
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;

    channel.onopen = () => {
      console.log("Data channel opened");
      this.updateState("connected");
      this.flushMessageQueue();
    };

    channel.onclose = () => {
      console.log("Data channel closed");
      this.updateState("disconnected");
    };

    channel.onerror = (error) => {
      console.error("Data channel error:", error);
      this.config.onError(new Error("Data channel error"));
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };
  }

  private handleMessage(data: {
    type: string;
    payload: unknown;
    isTyping: boolean;
  }) {
    switch (data.type) {
      case "message":
        this.lastMessageTime = Date.now();
        this.config.onMessage(data.payload as Message);
        break;

      case "typing":
        this.config.onTyping(data.isTyping);
        break;

      case "ping":
        this.send({ type: "pong" });
        break;

      case "pong":
        // Connection is alive
        break;

      default:
        console.warn("Unknown message type:", data.type);
    }
  }

  private updateState(newState: PeerConnectionState) {
    if (this.state === newState) return;
    this.state = newState;
    this.config.onStateChange(newState);
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      if (this.state === "disconnected" || this.state === "failed") {
        console.log("Attempting to reconnect...");
        this.restart();
      }
    }, 5000);
  }

  // Public Methods
  async start() {
    try {
      this.updateState("connecting");

      if (!this.config.isInitiator) return;
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.config.onSignal({ type: "offer", offer });
    } catch (error) {
      console.error("Failed to start connection:", error);
      this.config.onError(error as Error);
    }
  }

  async handleSignal(signal: {
    type: string;
    offer: RTCSessionDescriptionInit;
    answer: RTCSessionDescriptionInit;
    candidate: RTCIceCandidateInit;
  }) {
    try {
      switch (signal.type) {
        case "offer": {
          await this.pc.setRemoteDescription(
            new RTCSessionDescription(signal.offer),
          );
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          this.config.onSignal({ type: "answer", answer });
          break;
        }

        case "answer":
          await this.pc.setRemoteDescription(
            new RTCSessionDescription(signal.answer),
          );
          break;

        case "ice-candidate":
          await this.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          break;
      }
    } catch (error) {
      console.error("Failed to handle signal:", error);
      this.config.onError(error as Error);
    }
  }

  send(data: unknown) {
    if (this.isConnected && this.dataChannel) {
      try {
        this.dataChannel.send(JSON.stringify(data));
      } catch (error) {
        console.error("Failed to send message:", error);
        this.messageQueue.push(data);
      }
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(data);
    }
  }

  sendMessage(message: string) {
    this.send({
      type: "message",
      payload: { text: message, timestamp: Date.now() },
    });
  }

  sendTyping(isTyping: boolean) {
    this.send({ type: "typing", isTyping });
  }

  async restart() {
    this.close();

    // Create new peer connetion
    this.pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    this.setupPeerConnection();

    if (this.config.isInitiator) this.createDataChannel();

    await this.start();
  }

  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.pc) this.pc.close();

    this.updateState("closed");
    this.messageQueue = [];
  }

  get isConnected(): boolean {
    return (
      this.state === "connected" && this.dataChannel?.readyState === "open"
    );
  }

  get connectionState(): PeerConnectionState {
    return this.state;
  }

  get isInitiator(): boolean {
    return this.config.isInitiator;
  }

  get targetUsername(): string {
    return this.config.targetUsername;
  }

  get stats() {
    return {
      state: this.state,
      queuedMessages: this.messageQueue.length,
      lastMessageTime: this.lastMessageTime,
      dataChannelState: this.dataChannel?.readyState || "none",
      isInitiator: this.config.isInitiator,
      targetUsername: this.config.targetUsername,
    };
  }
}
