import type { OnlineUser } from "@/types/onlineUser";

export interface SignalingEvents {
  onUsersUpdate?: (users: OnlineUser[]) => void;
  onUserOnline?: (data: OnlineUser) => void;
  onUserOffline?: (data: { username: string }) => void;
  onUserReconnected?: (data: { username: string }) => void;
  onUserDisconnected?: (data: { username: string }) => void;
  onPrivateSignal?: (data: { fromUsername: string; signal: unknown }) => void;
  onTypingStart?: (data: { fromUsername: string }) => void;
  onTypingStop?: (data: { fromUsername: string }) => void;
  onRegisterSuccess?: (data: { username: string }) => void;
  onRegisterError?: (error: { message: string }) => void;
  onReconnectAttempt?: (attempt: number) => void;
  onReconnectFailed?: () => void;
  onConnectError?: (error: Error) => void;
}
