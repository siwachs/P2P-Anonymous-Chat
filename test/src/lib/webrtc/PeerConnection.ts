import { TypedEventEmitter } from "@/lib/event";

import type { Message } from "@/types/message";
import type { PeerConnectionState, PeerConnectionConfig } from "@/types/webRtc";

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

  constructor(config: PeerConnectionConfig) {
    super();

    this.config = config;
    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers || [
        { urls: "stun:stun.l.google.com:19302" },
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
      this.updateState(this.pc.connectionState);
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

    channel.onopen = () => this.updateState("connected");

    channel.onclose = () => this.updateState("disconnected");

    channel.onerror = (error) => this.config.onError(error as unknown as Error);

    channel.onmessage = (event) => this.incomingMessage(event.data);
  }

  private incomingMessage(raw: string) {
    try {
      const data = JSON.parse(raw);

      if (data.type === "message") {
        this.emit("message", data.payload);
      } else {
        this.emit("typing", data.isTyping);
      }
    } catch (error) {
      this.emit("error", error as Error);
    }
  }

  private updateState(newState: PeerConnectionState) {
    if (this.state === newState) return;

    this.state = newState;
    this.emit("stateChange", newState);
  }

  send(payload: unknown) {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify(payload));
    } else {
      this.messageQueue.push(payload);
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
}
