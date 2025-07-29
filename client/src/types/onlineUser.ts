export interface OnlineUser {
  username: string;
  status: "online" | "busy" | "away";
  country?: "string";
  intrests?: string[];
  connectedAt: number;
}

export interface OnlineUsersState {
  users: Record<string, OnlineUser>; // username -> user
  isConnected: boolean;
  lastUpdated: number;
}
