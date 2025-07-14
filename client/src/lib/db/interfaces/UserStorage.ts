import { UserInfo } from "@/types/user";

export interface IUserStorage {
  saveUser(user: UserInfo): Promise<void>;
  getCurrentUser(): Promise<UserInfo | null>;
  clearUser(): Promise<void>;
  updateUser(userId: string, updates: Partial<UserInfo>): Promise<void>;
}
