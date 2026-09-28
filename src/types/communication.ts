import { Attachment } from './common';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachments: Attachment[];
  sentAt: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  tempId?: string;
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  memberIds: string[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface PresenceState {
  userId: string;
  online: boolean;
  lastSeen?: string;
}

export interface CallLog {
  id: string;
  callerId: string;
  calleeId?: string;
  roomId?: string;
  kind: 'VOICE' | 'VIDEO' | 'LECTURE';
  startedAt: string;
  endedAt?: string;
  durationSec?: number;
  outcome: 'COMPLETED' | 'MISSED' | 'DECLINED';
}

export type CallState =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'failed';
