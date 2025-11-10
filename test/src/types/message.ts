export interface Message {
  id: string;
  conversationId: string; // For 1 to 1, this is oher user's username
  senderId: string;
  type: "text" | "emoji" | "image" | "file" | "system";
  content: string; // Could be text, emoji code, file URL, etc.
  metadata?: {
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
    name?: string;
    checksum?: string;
  };
  timestamp: number;
  isEncrypted: true;
  status: "pending" | "sent" | "delivered" | "failed";
}

export interface EncryptionKey {
  id: string;
  conversationId: string;
  publicKey: string;
  privateKey: string;
  sharedSecret: string;
  createdAt: number;
  expiresAt?: number;
}

export interface MessageState {
  messages: Record<string, Message>; // messageId -> message
  conversationMessages: Record<string, string[]>; // conversationId -> messageIds
  typingUsers: Record<string, boolean>; // username -> isTyping
}
