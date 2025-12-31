export { default as countries } from "./countries";
export const USER_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24 hour
export const SEND_TYPING_TIMEOUT_IN = 3000;

export const CONNECTION_STATUS = {
  new: { text: "Not connected", color: "text-muted-foreground" },
  connecting: { text: "Connecting...", color: "text-yellow-600" },
  connected: { text: "Connected", color: "text-green-600" },
  disconnected: { text: "Disconnected", color: "text-orange-600" },
  failed: { text: "Connection failed", color: "text-red-600" },
  closed: { text: "Connection closed", color: "text-muted-foreground" },
};
