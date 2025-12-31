import type { Age, Gender } from "./user";

export interface OnlineUser {
  username: string;
  status: "online" | "busy" | "away";
  age: Age;
  gender: Gender;
  country: "string";
  interests: string[];
  connectedAt: number;
}

export interface OnlineUsersState {
  users: Record<string, OnlineUser>; // username -> user
  isConnected: boolean;
  lastUpdated: number;
}
