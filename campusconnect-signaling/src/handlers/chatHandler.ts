import { Server, Socket } from 'socket.io';
import {
  ChatSendPayload,
  ChatAckPayload,
  ChatTypingPayload,
  ChatReadPayload,
  Message,
} from '../types/socket.js';
import { userSocketMap } from './presenceHandler.js';

// This server keeps no conversation store, so the sender names the recipients. Nothing is broadcast to every socket.
function socketIdsOf(userIds: unknown, excludeUserId: string): string[] {
  if (!Array.isArray(userIds)) return [];
  const unique = new Set(
    userIds.filter((id): id is string => typeof id === 'string' && id !== excludeUserId)
  );
  const socketIds: string[] = [];
  unique.forEach((id) => {
    userSocketMap.get(id)?.forEach((socketId) => socketIds.push(socketId));
  });
  return socketIds;
}

export function registerChatHandlers(io: Server, socket: Socket) {
  const userId: string | undefined = socket.data.user?.userId;
  if (!userId) return;

  socket.on('chat:send', (payload: ChatSendPayload) => {
    if (!payload || typeof payload.conversationId !== 'string' || typeof payload.body !== 'string') {
      return;
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullMessage: Message = {
      id: messageId,
      conversationId: payload.conversationId,
      senderId: userId,
      body: payload.body,
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
      sentAt: new Date().toISOString(),
      status: 'SENT',
      tempId: payload.tempId,
    };

    const ackPayload: ChatAckPayload = {
      tempId: payload.tempId,
      message: fullMessage,
    };
    socket.emit('chat:ack', ackPayload);

    const ownOtherSockets = Array.from(userSocketMap.get(userId) ?? []).filter((id) => id !== socket.id);
    [...socketIdsOf(payload.recipientIds, userId), ...ownOtherSockets].forEach((socketId) => {
      io.to(socketId).emit('chat:message', fullMessage);
    });
  });

  socket.on('chat:typing', (payload: ChatTypingPayload) => {
    if (!payload || typeof payload.conversationId !== 'string') return;
    const typing: ChatTypingPayload = {
      conversationId: payload.conversationId,
      userId,
      isTyping: payload.isTyping === true,
    };
    socketIdsOf(payload.recipientIds, userId).forEach((socketId) => {
      io.to(socketId).emit('chat:typing', typing);
    });
  });

  socket.on('chat:read', (payload: ChatReadPayload) => {
    if (!payload || typeof payload.conversationId !== 'string') return;
    const read: ChatReadPayload = { conversationId: payload.conversationId, userId };
    socketIdsOf(payload.recipientIds, userId).forEach((socketId) => {
      io.to(socketId).emit('chat:read', read);
    });
  });
}
