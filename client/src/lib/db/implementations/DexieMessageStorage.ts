import Dexie, { Table } from "dexie";

import { EncryptionKey, Message } from "@/types/message";
import { IMessageStorage } from "@/lib/db/interfaces/MessageStorage";

class MessageDatabase extends Dexie {
  messages!: Table<Message>;
  encryptionKeys!: Table<EncryptionKey>;

  constructor() {
    super("P2PChatMessagesDB");
    this.version(1).stores({
      messages:
        "id, conversationId, timestamp, senderId, [conversationId+timestamp]",
      encryptionKeys: "id, conversationId, createdAt, expiresAt",
    });
  }
}

const db = new MessageDatabase();

export class DexieMessageStorage implements IMessageStorage {
  async saveMessage(message: Message): Promise<void> {
    await db.messages.put(message);
  }

  async saveMessages(messages: Message[]): Promise<void> {
    await db.messages.bulkPut(messages);
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 100,
  ): Promise<Message[]> {
    const messages = await db.messages
      .where("conversationId")
      .equals(conversationId)
      .reverse()
      .limit(limit)
      .toArray();

    return messages.reverse();
  }

  async getMessagesPaginated(
    conversationId: string,
    limit: number = 50,
    before?: number,
  ): Promise<Message[]> {
    let query = db.messages
      .where("conversationId")
      .equals(conversationId)
      .reverse()
      .limit(limit);

    if (before) {
      query = query.and((message) => message.timestamp < before);
    }

    const messages = await query.toArray();
    return messages.reverse();
  }

  async updateMessageStatus(
    messageId: string,
    status: Message["status"],
  ): Promise<void> {
    await db.messages.update(messageId, { status });
  }

  async cleanOldMessages(daysToKeep: number = 1): Promise<void> {
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    await db.messages.where("timestamp").below(cutoffTime).delete();
  }

  async clearConversation(conversationId: string): Promise<void> {
    await db.messages.where("conversationId").equals(conversationId).delete();
  }

  async saveEncryptionKey(key: EncryptionKey): Promise<void> {
    await db.encryptionKeys.put(key);
  }

  async getEncryptionKey(
    conversationId: string,
  ): Promise<EncryptionKey | null> {
    const key = await db.encryptionKeys
      .where("conversationId")
      .equals(conversationId)
      .and(
        (key) =>
          typeof key.expiresAt === "number" && key.expiresAt > Date.now(),
      )
      .reverse()
      .limit(1)
      .toArray();

    return key.length > 0 ? key[0] : null;
  }

  async clearExpiredKeys(): Promise<void> {
    await db.encryptionKeys.where("expiresAt").below(Date.now()).delete();
  }

  async getAllConversations(): Promise<string[]> {
    const messages = await db.messages.orderBy("conversationId").uniqueKeys();

    return messages as string[];
  }

  async getLastMessages(): Promise<Record<string, Message>> {
    const conversations = await this.getAllConversations();
    const lastMessages: Record<string, Message> = {};

    for (const conversationId of conversations) {
      const messages = await db.messages
        .where("conversationId")
        .equals(conversationId)
        .reverse()
        .limit(1)
        .toArray();

      if (messages.length > 0) {
        lastMessages[conversationId] = messages[0];
      }
    }

    return lastMessages;
  }
}
