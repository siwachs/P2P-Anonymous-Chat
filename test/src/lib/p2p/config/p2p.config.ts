export interface IP2PConfig {
  signaling: {
    reconnectDelay: number;
    reconnectDelayMax: number;
    maxAttempts: number;
    timeout: number;
    serverUrl?: string;
  };
  rtc: {
    reconnectDelay: number;
    maxReconnectAttempts: number;
    connectionTimeout: number;
    messageDeliveryDelay: number;
    maxConnections: number;
    maxMessageSize: number;
    dataChannelLabel: string;
    iceServers: RTCIceServer[];
  };
  performance: {
    messageBatchSize: number;
    messageBatchDelay: number;
    typingDebounceDelay: number;
    connectionHealthCheckInterval: number;
  };
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const P2P_CONFIG: IP2PConfig = {
  signaling: {
    reconnectDelay:
      Number(import.meta.env.VITE_SIGNALING_RECONNECT_DELAY) || 1000,
    reconnectDelayMax:
      Number(import.meta.env.VITE_SIGNALING_RECONNECT_DELAY_MAX) || 5000,
    maxAttempts: Number(import.meta.env.VITE_SIGNALING_MAX_ATTEMPTS) || 5,
    timeout: Number(import.meta.env.VITE_SIGNALING_TIMEOUT) || 20000,
    serverUrl: import.meta.env.VITE_SIGNALING_URL,
  },
  rtc: {
    reconnectDelay: Number(import.meta.env.VITE_RTC_RECONNECT_DELAY) || 5000,
    maxReconnectAttempts:
      Number(import.meta.env.VITE_RTC_MAX_RECONNECT_ATTEMPTS) || 5,
    connectionTimeout:
      Number(import.meta.env.VITE_RTC_CONNECTION_TIMEOUT) || 15000,
    messageDeliveryDelay:
      Number(import.meta.env.VITE_MESSAGE_DELIVERY_DELAY) || 150,
    maxConnections: Number(import.meta.env.VITE_MAX_P2P_CONNECTIONS) || 10,
    maxMessageSize: Number(import.meta.env.VITE_MAX_MESSAGE_SIZE) || 64 * 1024, // 64KB
    dataChannelLabel: "p2p-chat",
    iceServers: DEFAULT_ICE_SERVERS,
  },
  performance: {
    messageBatchSize: Number(import.meta.env.VITE_MESSAGE_BATCH_SIZE) || 10,
    messageBatchDelay: Number(import.meta.env.VITE_MESSAGE_BATCH_DELAY) || 100,
    typingDebounceDelay:
      Number(import.meta.env.VITE_TYPING_DEBOUNCE_DELAY) || 300,
    connectionHealthCheckInterval:
      Number(import.meta.env.VITE_HEALTH_CHECK_INTERVAL) || 30000,
  },
};

export default P2P_CONFIG;
