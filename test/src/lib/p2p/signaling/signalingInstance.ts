import SignalingClient from "./SignalingClient";

let instance: SignalingClient | null = null;

export function getSignalingInstance(): SignalingClient {
  instance ??= new SignalingClient();
  return instance;
}

export function clearSignalingInstance(): void {
  instance?.disconnect();
  instance = null;
}
