export const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const RTC_DATA_CHANNEL_LABEL = 'p2p-chat';

export const RTC_RECONNECT_DELAY = 5000;
export const RTC_MAX_RECONNECT_ATTEMPT = 5;
export const RTC_CONNECTION_TIMEOUT = 20000; // 20

export const MESSAGE_DELIVERY_DELAY = 100; // artificial delivery delay for status updates
export const MAX_MESSAGE_SIZE = 64 * 1024; // 64KB, beyond which we chunk files