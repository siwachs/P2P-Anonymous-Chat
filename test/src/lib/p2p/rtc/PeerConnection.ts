import { nanoid } from "nanoid";

import { TypedEventEmitter } from "@/lib/event";

import type { Message } from "@/types/message";
import type {
  PeerConnectionState,
  PeerConnectionConfig,
  Signal,
} from "./types";
import { DEFAULT_ICE_SERVERS } from "./constants";

export default class PeerConnection extends TypedEventEmitter<{
  message: Message;
  typing: boolean;
  stateChange: PeerConnectionState;
  error: Error;
}> {
  private pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private readonly config: PeerConnectionConfig;
  private state: PeerConnectionState = "new";
  private messageQueue: unknown[] = [];
  private lastMessageTime = new Date();

  constructor(config: PeerConnectionConfig) {
    super();

    this.config = config;
    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers || DEFAULT_ICE_SERVERS,
    });

    this.setupPeerConnection();

    if (config.isInitiator) this.createDataChannel();
  }

  // Core WebRTC setup
  private setupPeerConnection() {
    // ICE candidate -> signaling
    this.pc.onicecandidate = (event) => {
      if (event.candidate)
        this.config.onSignal({
          type: "ice-candidate",
          candidate: event.candidate,
        });
    };

    // Track connection state
    this.pc.onconnectionstatechange = () => {
      this.updateState(this.pc.connectionState);
      if (this.pc.connectionState === "connected") this.flushMessageQueue();
    };

    // Non-initiator receives channelx
    this.pc.ondatachannel = (event) => this.setupDataChannel(event.channel);
  }

  private createDataChannel() {
    this.dataChannel = this.pc.createDataChannel("p2p-chat", {
      ordered: true,
      maxRetransmits: 3,
    });
    this.setupDataChannel(this.dataChannel);
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;

    channel.onopen = () => {
      this.updateState("connected");
      this.flushMessageQueue();
    };

    channel.onclose = () => {
      this.updateState("disconnected");
    };

    channel.onerror = (error) => {
      this.emit("error", error as unknown as Error);
    };

    channel.onmessage = (event) => this.incomingMessage(event.data);
  }

  private incomingMessage(raw: string) {
    try {
      const data = JSON.parse(raw);

      switch (data.type) {
        case "message":
          this.lastMessageTime = new Date();
          this.emit("message", data.payload as Message);
          break;
        case "typing":
          this.emit("typing", data.isTyping);
          break;
        default:
          console.warn("PeerConnection: unknown data.type", data.type);
      }
    } catch (error) {
      this.emit("error", error as Error);
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const msg = this.messageQueue.shift();
      this.send(msg);
    }
  }

  private updateState(newState: PeerConnectionState) {
    if (this.state === newState) return;

    this.state = newState;
    this.emit("stateChange", newState);
  }

  send(payload: unknown) {
    if (this.isConnected && this.dataChannel) {
      try {
        this.dataChannel.send(JSON.stringify(payload));
      } catch (error) {
        console.error("PeerConnection.send failed, queueing", error);
        this.messageQueue.push(payload);
      }
    } else {
      // not connected yet -> queue
      this.messageQueue.push(payload);
    }
  }

  sendMessage(
    content: string,
    type: Message["type"] = "text",
    metadata?: Message["metadata"]
  ) {
    const message: Message = {
      id: nanoid(),
      conversationId: this.config.targetUsername,
      senderId: this.config.username,
      type,
      content,
      metadata,
      timestamp: Date.now(),
      isEncrypted: true,
      status: "sent",
    };

    this.send({ type: "message", payload: message });
  }

  sendTyping(isTyping: boolean) {
    this.send({ type: "typing", isTyping });
  }

  // Signaling / lifecycle
  async handleSignal(signal: Signal) {
    try {
      switch (signal.type) {
        case "offer": {
          await this.pc.setRemoteDescription(signal.offer!);
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          this.config.onSignal({ type: "answer", answer });
          break;
        }
        case "answer":
          await this.pc.setRemoteDescription(signal.answer!);
          break;
        case "ice-candidate":
          await this.pc.addIceCandidate(signal.candidate);
          break;
        default:
          console.warn(
            "PeerConnection.handleSignal unknown type:",
            signal.type
          );
      }
    } catch (error) {
      this.emit("error", error as Error);
    }
  }

  async start() {
    try {
      if (!this.config.isInitiator) return;

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.config.onSignal({ type: "offer", offer });
    } catch (err) {
      this.emit("error", err as Error);
    }
  }

  // restart: recreate RTCPeerConnection and (optionally) data channel
  async restart() {
    try {
      this.close();

      this.pc = new RTCPeerConnection({
        iceServers: this.config.iceServers || DEFAULT_ICE_SERVERS,
      });
      this.setupPeerConnection();

      if (this.config.isInitiator) this.createDataChannel();
      await this.start();
    } catch (err) {
      this.emit("error", err as Error);
    }
  }

  close() {
    try {
      this.dataChannel?.close();
      this.dataChannel = null;
      this.pc.close();
      this.updateState("closed");
      this.messageQueue = [];
    } catch (error) {
      console.warn("PeerConnection.close error", error);
    }
  }

  // Helpers / getters
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
      dataChannelState: this.dataChannel?.readyState ?? "none",
      isInitiator: this.config.isInitiator,
      targetUsername: this.config.targetUsername,
    };
  }
}
