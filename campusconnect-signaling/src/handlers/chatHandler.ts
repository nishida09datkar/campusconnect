import { Server, Socket } from 'socket.io';
import {
  ChatSendPayload,
  ChatAckPayload,
  ChatTypingPayload,
  ChatReadPayload,
  Message,
} from '../types/socket.js';
import { userSocketMap } from './presenceHandler.js';

export function registerChatHandlers(io: Server, socket: Socket) {
  const currentUser = socket.data.user;

  socket.on('chat:join', (conversationId: string) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on('chat:leave', (conversationId: string) => {
    socket.leave(`conv:${conversationId}`);
  });

  socket.on('chat:send', (payload: ChatSendPayload) => {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullMessage: Message = {
      id: messageId,
      conversationId: payload.conversationId,
      senderId: payload.senderId || currentUser?.userId,
      body: payload.body,
      attachments: payload.attachments || [],
      sentAt: new Date().toISOString(),
      status: 'SENT',
      tempId: payload.tempId,
    };

    // Acknowledge back to sender
    const ackPayload: ChatAckPayload = {
      tempId: payload.tempId,
      message: fullMessage,
    };
    socket.emit('chat:ack', ackPayload);

    // Broadcast message to room if in room
    socket.to(`conv:${payload.conversationId}`).emit('chat:message', fullMessage);
    // Also broadcast globally to ensure other open tabs of participants receive it
    socket.broadcast.emit('chat:message', fullMessage);
  });

  socket.on('chat:typing', (payload: ChatTypingPayload) => {
    socket.to(`conv:${payload.conversationId}`).emit('chat:typing', payload);
    socket.broadcast.emit('chat:typing', payload);
  });

  socket.on('chat:read', (payload: ChatReadPayload) => {
    socket.to(`conv:${payload.conversationId}`).emit('chat:read', payload);
    socket.broadcast.emit('chat:read', payload);
  });
}
