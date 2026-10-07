import { Message, Attachment, PresenceState } from '@/types';

export interface ChatSendPayload {
  conversationId: string;
  senderId: string;
  body: string;
  attachments?: Attachment[];
  tempId: string;
}

export interface ChatAckPayload {
  tempId: string;
  message: Message;
}

export interface ChatTypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ChatReadPayload {
  conversationId: string;
  userId: string;
}

export interface SocketEventMap {
  'chat:send': (payload: ChatSendPayload) => void;
  'chat:ack': (payload: ChatAckPayload) => void;
  'chat:message': (payload: Message) => void;
  'chat:typing': (payload: ChatTypingPayload) => void;
  'chat:read': (payload: ChatReadPayload) => void;
  'presence:update': (payload: PresenceState) => void;
  'connect': () => void;
  'disconnect': (reason?: string) => void;
}

export type SocketEventName = keyof SocketEventMap;
