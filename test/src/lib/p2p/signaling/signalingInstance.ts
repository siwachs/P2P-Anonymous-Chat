import SignalingClient from "./SignalingClient";

let instance: SignalingClient | null = null;

export function getSignalingInstance(): SignalingClient {
  if (!instance) {
    instance = new SignalingClient();
  }

  return instance;
}

export function clearSignalingInstance(): void {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}
