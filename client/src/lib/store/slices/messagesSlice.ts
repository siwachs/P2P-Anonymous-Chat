import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Message, MessageState } from "@/types/message";

const initialState: MessageState = {
  messages: {},
  conversationMessages: {},
  typingUsers: {},
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;

      state.messages[message.id] = message;

      // Add to conversation
      if (!state.conversationMessages[message.conversationId])
        state.conversationMessages[message.conversationId] = [];

      state.conversationMessages[message.conversationId].push(message.id);
    },

    updateMessageStatus: (
      state,
      action: PayloadAction<{ messageId: string; status: Message["status"] }>,
    ) => {
      if (state.messages[action.payload.messageId])
        state.messages[action.payload.messageId].status = action.payload.status;
    },

    setTypingUser: (
      state,
      action: PayloadAction<{ username: string; isTyping: boolean }>,
    ) => {
      if (action.payload.isTyping)
        state.typingUsers[action.payload.username] = true;
      else delete state.typingUsers[action.payload.username];
    },

    clearConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const messageIds = state.conversationMessages[conversationId] || [];

      // Remove messages
      messageIds.forEach((id) => {
        delete state.messages[id];
      });

      // Remove conversation
      delete state.conversationMessages[conversationId];
      delete state.typingUsers[conversationId];
    },

    clearAllMessages: (state) => {
      state.messages = {};
      state.conversationMessages = {};
      state.typingUsers = {};
    },
  },
});

export const {
  addMessage,
  updateMessageStatus,
  setTypingUser,
  clearConversation,
  clearAllMessages,
} = messagesSlice.actions;
export default messagesSlice.reducer;

// Selectors
export const selectConversationMessages = (
  state: { messages: MessageState },
  conversationId: string,
): Message[] => {
  const messageIds = state.messages.conversationMessages[conversationId] || [];

  return messageIds
    .map((id) => state.messages.messages[id])
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
};

export const selectIsUserTyping = (
  state: {
    messages: MessageState;
  },
  username: string,
): boolean => {
  return state.messages.typingUsers[username] || false;
};
