export interface UserInfo {
  id: string;
  username: string;
  age: number;
  gender: "male" | "female" | "other" | "prefer-not-to-say";
  country: string;
  interests: string[];
  createdAt: number;
  expiresAt: number;
}

export interface UserState {
  currentUser: UserInfo | null;
  isLoading: boolean;
  error: string | null;
}
