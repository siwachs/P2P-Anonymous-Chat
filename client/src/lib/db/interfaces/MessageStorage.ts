import { Message, EncryptionKey } from "@/types/message";

export interface IMessageStorage {
  saveMessage(message: Message): Promise<void>;
  saveMessages(messages: Message[]): Promise<void>;
  getConversationMessages(
    conversationId: string,
    limit: number,
  ): Promise<Message[]>;
  getMessagesPaginated(
    conversationId: string,
    limit: number,
    before?: number,
  ): Promise<Message[]>;
  updateMessageStatus(
    messageId: string,
    status: Message["status"],
  ): Promise<void>;
  cleanOldMessages(daysToKeep: number): Promise<void>;
  clearConversation(conversationId: string): Promise<void>;
  saveEncryptionKey(key: EncryptionKey): Promise<void>;
  getEncryptionKey(conversationId: string): Promise<EncryptionKey | null>;
  clearExpiredKeys(): Promise<void>;
  getAllConversations(): Promise<string[]>;
  getLastMessages(): Promise<Record<string, Message>>;
}
