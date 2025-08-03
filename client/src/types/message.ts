export interface Message {
  id: string;
  conversationId: string; // For 1 to 1, this is oher user's username
  senderId: string;
  content: string;
  timestamp: number;
  isEncrypted: boolean;
  status: "pending" | "sent" | "delivered" | "failed";
}

export interface MessageState {
  messages: Record<string, Message>; // messageId -> message
  conversationMessages: Record<string, string[]>; // conversationId -> messageIds
  typingUsers: Record<string, boolean>; // username -> isTyping
}
