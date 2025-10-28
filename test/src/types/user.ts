export type Age =
  | "18-24"
  | "25-34"
  | "35-44"
  | "45-54"
  | "55+"
  | "Prefer not to say";

export type Gender = "Male" | "Female" | "Others" | "Prefer not to say";

export interface UserInfo {
  id: string;
  username: string;
  age: Age;
  gender: Gender;
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
