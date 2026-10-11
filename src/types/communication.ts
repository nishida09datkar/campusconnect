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
  audioUrl?: string;
  audioDurationSec?: number;
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
  callerName?: string;
  calleeId?: string;
  calleeName?: string;
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

export interface NotificationPreferences {
  userId?: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  assignmentAlerts: boolean;
  announcementAlerts: boolean;
  meetingAlerts: boolean;
  chatAlerts: boolean;
  attendanceAlerts: boolean;
  digestFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | string;
}

export interface EmailSendResult {
  status: 'SENT' | 'SUPPRESSED' | 'UNCONFIGURED' | 'FAILED' | string;
  recipient: string;
  message: string;
  eventType: string;
  timestamp: number;
}
