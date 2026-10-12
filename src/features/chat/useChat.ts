import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import {
  fetchConversations,
  fetchConversationMessages,
  setActiveConversationId,
  addOptimisticMessage,
  messageAckReceived,
  messageReceived,
  messageSendFailed,
  typingStateChanged,
  markConversationAsRead,
} from './chatSlice';
import {
  selectAllConversations,
  selectActiveConversation,
  selectActiveConversationMessages,
  selectActiveConversationTyping,
  selectTotalUnreadCount,
  selectChatLoading,
} from './chatSelectors';
import { useSocket, useSocketEvent } from '@/hooks/useSocket';
import { Attachment, Message } from '@/types';
import { ChatAckPayload, ChatTypingPayload } from '@/socket/events';

export function useChat() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const conversations = useAppSelector(selectAllConversations);
  const activeConversation = useAppSelector(selectActiveConversation);
  const messages = useAppSelector(selectActiveConversationMessages);
  const typingUserIds = useAppSelector(selectActiveConversationTyping);
  const unreadCount = useAppSelector(selectTotalUnreadCount);
  const loading = useAppSelector(selectChatLoading);
  const failedMessageIds = useAppSelector((state) => state.chat.failedTempMessageIds);

  const { emitSend, emitTyping, emitRead } = useSocket();

  // Realtime events are addressed to the other members; the signaling server delivers to nobody else.
  const recipientIdsRef = useRef<string[]>([]);
  recipientIdsRef.current =
    activeConversation && currentUser
      ? activeConversation.memberIds.filter((id) => id !== currentUser.id)
      : [];

  // Load conversations on mount
  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchConversations(currentUser.id));
    }
  }, [currentUser?.id, dispatch]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation?.id) {
      dispatch(fetchConversationMessages({ conversationId: activeConversation.id, page: 1 }));
      if (currentUser?.id) {
        dispatch(markConversationAsRead({ conversationId: activeConversation.id, userId: currentUser.id }));
        emitRead(activeConversation.id, currentUser.id, recipientIdsRef.current);
      }
    }
  }, [activeConversation?.id, currentUser?.id, dispatch, emitRead]);

  // Socket listener for new messages
  useSocketEvent('chat:message', useCallback((message: Message) => {
    dispatch(messageReceived(message));
    if (currentUser && message.conversationId === activeConversation?.id && message.senderId !== currentUser.id) {
      dispatch(markConversationAsRead({ conversationId: message.conversationId, userId: currentUser.id }));
      emitRead(message.conversationId, currentUser.id, recipientIdsRef.current);
    }
  }, [dispatch, currentUser, activeConversation?.id, emitRead]));

  // Socket listener for acks
  useSocketEvent('chat:ack', useCallback((ack: ChatAckPayload) => {
    dispatch(messageAckReceived(ack));
  }, [dispatch]));

  // Socket listener for typing indicators
  useSocketEvent('chat:typing', useCallback((payload: ChatTypingPayload) => {
    // Only care if typing event is not from self
    if (currentUser && payload.userId !== currentUser.id) {
      dispatch(typingStateChanged(payload));
    }
  }, [dispatch, currentUser]));

  // Send message optimistically
  const sendMessage = useCallback((body: string, attachments: Attachment[] = []) => {
    if (!activeConversation || !currentUser) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      body,
      attachments,
      tempId,
    };

    // 1. Redux optimistic update
    dispatch(addOptimisticMessage(payload));

    // 2. Emit through socket
    try {
      emitSend({ ...payload, recipientIds: recipientIdsRef.current });
    } catch {
      dispatch(messageSendFailed({ tempId }));
    }
  }, [activeConversation, currentUser, dispatch, emitSend]);

  // Retry sending failed message
  const retryMessage = useCallback((tempId: string, body: string, attachments: Attachment[] = []) => {
    if (!activeConversation || !currentUser) return;
    const payload = {
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      body,
      attachments,
      tempId,
    };
    try {
      emitSend({ ...payload, recipientIds: recipientIdsRef.current });
    } catch {
      dispatch(messageSendFailed({ tempId }));
    }
  }, [activeConversation, currentUser, emitSend, dispatch]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!activeConversation || !currentUser) return;
    emitTyping(activeConversation.id, currentUser.id, isTyping, recipientIdsRef.current);
  }, [activeConversation, currentUser, emitTyping]);

  const selectConversation = useCallback((id: string | null) => {
    dispatch(setActiveConversationId(id));
  }, [dispatch]);

  return {
    currentUser,
    conversations,
    activeConversation,
    messages,
    typingUserIds,
    unreadCount,
    loading,
    failedMessageIds,
    selectConversation,
    sendMessage,
    retryMessage,
    setTyping,
  };
}
