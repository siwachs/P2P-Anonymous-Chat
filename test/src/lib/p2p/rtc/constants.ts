import { P2P_CONFIG } from "../config/p2p.config";

export const DEFAULT_ICE_SERVERS = P2P_CONFIG.rtc.iceServers;
export const RTC_DATA_CHANNEL_LABEL = P2P_CONFIG.rtc.dataChannelLabel;
export const RTC_RECONNECT_DELAY = P2P_CONFIG.rtc.reconnectDelay;
export const RTC_MAX_RECONNECT_ATTEMPT = P2P_CONFIG.rtc.maxReconnectAttempts;
export const RTC_CONNECTION_TIMEOUT = P2P_CONFIG.rtc.connectionTimeout;
export const MESSAGE_DELIVERY_DELAY = P2P_CONFIG.rtc.messageDeliveryDelay;
export const MAX_MESSAGE_SIZE = P2P_CONFIG.rtc.maxMessageSize;
export const MAX_CONNECTIONS = P2P_CONFIG.rtc.maxConnections;
