import Dexie, { Table } from "dexie";

import { UserInfo } from "@/types/user";

class UserDatabase extends Dexie {
  users!: Table<UserInfo>;

  constructor() {
    super("P2PChatUserDB");
    this.version(1).stores({ users: "id, username, createdAt, expiresAt" });
  }
}

const db = new UserDatabase();

export const userStorage = {
  async saveUser(user: UserInfo): Promise<void> {
    await db.users.put(user);
  },

  async getCurrentUser(): Promise<UserInfo | null> {
    const users = await db.users.toArray();
    const now = Date.now();

    const validUser = users.find((user) => user.expiresAt > now);

    await db.users.where("expiresAt").below(now).delete();

    return validUser || null;
  },

  async clearUser(): Promise<void> {
    await db.users.clear();
  },

  async updateUser(userId: string, updates: Partial<UserInfo>): Promise<void> {
    await db.users.update(userId, updates);
  },
};
