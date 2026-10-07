import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction,
} from '@reduxjs/toolkit';
import { Conversation, Message, Attachment } from '@/types';
import { chatService } from '@/api/services/chat.service';

// Entity adapter for normalized messages across conversations
export const messagesAdapter = createEntityAdapter<Message>({
  sortComparer: (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
});

export interface OptimisticSendPayload {
  conversationId: string;
  senderId: string;
  body: string;
  attachments?: Attachment[];
  tempId: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ReturnType<typeof messagesAdapter.getInitialState>;
  typingByConversation: Record<string, Record<string, boolean>>;
  loadingConversations: boolean;
  loadingMessages: boolean;
  error: string | null;
  hasMoreByConversation: Record<string, boolean>;
  pageByConversation: Record<string, number>;
  failedTempMessageIds: string[];
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: messagesAdapter.getInitialState(),
  typingByConversation: {},
  loadingConversations: false,
  loadingMessages: false,
  error: null,
  hasMoreByConversation: {},
  pageByConversation: {},
  failedTempMessageIds: [],
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (userId: string) => {
    return await chatService.listConversations(userId);
  }
);

export const fetchConversationMessages = createAsyncThunk(
  'chat/fetchConversationMessages',
  async ({
    conversationId,
    page = 1,
    limit = 30,
  }: {
    conversationId: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await chatService.getMessages(conversationId, { page, limit });
    return { conversationId, ...res };
  }
);

export const markConversationAsRead = createAsyncThunk(
  'chat/markConversationAsRead',
  async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
    return await chatService.markAsRead(conversationId, userId);
  }
);

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversationId: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
      if (action.payload) {
        // Clear unread count locally for active conversation
        const conv = state.conversations.find((c) => c.id === action.payload);
        if (conv) {
          conv.unreadCount = 0;
        }
      }
    },

    // Optimistic message send
    addOptimisticMessage: (state, action: PayloadAction<OptimisticSendPayload>) => {
      const { conversationId, senderId, body, attachments, tempId } = action.payload;
      const optimisticMsg: Message = {
        id: tempId,
        tempId,
        conversationId,
        senderId,
        body,
        attachments: attachments || [],
        sentAt: new Date().toISOString(),
        status: 'SENT',
      };

      messagesAdapter.addOne(state.messages, optimisticMsg);

      // Update conversation's last message
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = optimisticMsg;
      }
    },

    // Message acknowledged from server/mockSocket
    messageAckReceived: (
      state,
      action: PayloadAction<{ tempId: string; message: Message }>
    ) => {
      const { tempId, message } = action.payload;
      // Remove temp entity
      messagesAdapter.removeOne(state.messages, tempId);
      // Insert confirmed entity
      messagesAdapter.upsertOne(state.messages, message);

      // Remove from failed list if present
      state.failedTempMessageIds = state.failedTempMessageIds.filter((id) => id !== tempId);

      // Update conversation lastMessage
      const conv = state.conversations.find((c) => c.id === message.conversationId);
      if (conv) {
        conv.lastMessage = message;
      }
    },

    // Message send failure
    messageSendFailed: (state, action: PayloadAction<{ tempId: string }>) => {
      if (!state.failedTempMessageIds.includes(action.payload.tempId)) {
        state.failedTempMessageIds.push(action.payload.tempId);
      }
    },

    // Incoming message from socket
    messageReceived: (state, action: PayloadAction<Message>) => {
      const msg = action.payload;
      messagesAdapter.upsertOne(state.messages, msg);

      // Update conversation in list
      const conv = state.conversations.find((c) => c.id === msg.conversationId);
      if (conv) {
        conv.lastMessage = msg;
        // If not in active conversation, increment unread
        if (state.activeConversationId !== msg.conversationId) {
          conv.unreadCount += 1;
        }
      }
    },

    // Typing state update
    typingStateChanged: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>
    ) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state.typingByConversation[conversationId]) {
        state.typingByConversation[conversationId] = {};
      }
      if (isTyping) {
        state.typingByConversation[conversationId][userId] = true;
      } else {
        delete state.typingByConversation[conversationId][userId];
      }
    },

    // New conversation added
    conversationCreated: (state, action: PayloadAction<Conversation>) => {
      const exists = state.conversations.some((c) => c.id === action.payload.id);
      if (!exists) {
        state.conversations.unshift(action.payload);
      }
    },

    // User left group
    groupLeft: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.memberIds = conv.memberIds.filter((id) => id !== userId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loadingConversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false;
        state.error = action.error.message || 'Failed to load conversations';
      })

      // fetchConversationMessages
      .addCase(fetchConversationMessages.pending, (state) => {
        state.loadingMessages = true;
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        const { conversationId, messages, hasMore, page } = action.payload;
        messagesAdapter.upsertMany(state.messages, messages);
        state.hasMoreByConversation[conversationId] = hasMore;
        state.pageByConversation[conversationId] = page;
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.error.message || 'Failed to load messages';
      })

      // markConversationAsRead
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv) {
          conv.unreadCount = 0;
        }
        // Update statuses in message entities
        const all = messagesAdapter.getSelectors().selectAll(state.messages);
        all.forEach((m) => {
          if (m.conversationId === conversationId && m.status !== 'READ') {
            messagesAdapter.updateOne(state.messages, {
              id: m.id,
              changes: { status: 'READ' },
            });
          }
        });
      });
  },
});

export const {
  setActiveConversationId,
  addOptimisticMessage,
  messageAckReceived,
  messageSendFailed,
  messageReceived,
  typingStateChanged,
  conversationCreated,
  groupLeft,
} = chatSlice.actions;

export default chatSlice.reducer;
