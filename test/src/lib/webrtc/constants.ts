const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const RTC_DATA_CHANNEL_LABEL = "p2p-chat";

const RTC_RECONNECT_DELAY = 5000;
const RTC_MAX_RECONNECT_ATTEMPT = 5;
const RTC_CONNECTION_TIMEOUT = 20000; // 20

const MESSAGE_DELIVERY_DELAY = 100; // artificial delivery delay for status updates
const MAX_MESSAGE_SIZE = 64 * 1024; // 64KB, beyond which we chunk files

export {
  DEFAULT_ICE_SERVERS,
  RTC_DATA_CHANNEL_LABEL,
  RTC_RECONNECT_DELAY,
  RTC_MAX_RECONNECT_ATTEMPT,
  RTC_CONNECTION_TIMEOUT,
  MESSAGE_DELIVERY_DELAY,
  MAX_MESSAGE_SIZE,
};
