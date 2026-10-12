import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { messagesAdapter } from './chatSlice';

// Adapter selectors
const messageSelectors = messagesAdapter.getSelectors<RootState>(
  (state) => state.chat.messages
);

export const selectAllMessages = messageSelectors.selectAll;
export const selectMessageById = messageSelectors.selectById;

export const selectAllConversations = (state: RootState) => state.chat.conversations;

export const selectActiveConversationId = (state: RootState) =>
  state.chat.activeConversationId;

export const selectActiveConversation = createSelector(
  [selectAllConversations, selectActiveConversationId],
  (conversations, activeId) =>
    activeId ? conversations.find((c) => c.id === activeId) : undefined
);

export const selectConversationById = (conversationId: string) =>
  createSelector([selectAllConversations], (conversations) =>
    conversations.find((c) => c.id === conversationId)
  );

export const selectMessagesForConversation = (conversationId: string) =>
  createSelector([selectAllMessages], (messages) =>
    messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
  );

export const selectActiveConversationMessages = createSelector(
  [selectAllMessages, selectActiveConversationId],
  (messages, activeId) => {
    if (!activeId) return [];
    return messages
      .filter((m) => m.conversationId === activeId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }
);

export const selectActiveConversationTyping = createSelector(
  [(state: RootState) => state.chat.typingByConversation, selectActiveConversationId],
  (typingMap, activeId) => {
    if (!activeId || !typingMap[activeId]) return [];
    return Object.keys(typingMap[activeId]).filter((userId) => typingMap[activeId][userId]);
  }
);

export const selectTotalUnreadCount = createSelector(
  [selectAllConversations],
  (conversations) =>
    conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
);

export const selectChatLoading = createSelector(
  [
    (state: RootState) => state.chat.loadingConversations,
    (state: RootState) => state.chat.loadingMessages,
  ],
  (conversations, messages) => ({ conversations, messages })
);

export const selectChatError = (state: RootState) => state.chat.error;

export const selectHasMoreMessages = (conversationId: string) => (state: RootState) =>
  Boolean(state.chat.hasMoreByConversation[conversationId]);

export const selectFailedMessageIds = (state: RootState) =>
  state.chat.failedTempMessageIds;
