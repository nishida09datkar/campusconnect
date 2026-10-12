export interface UserTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface PresenceState {
  userId: string;
  online: boolean;
  lastSeen?: string;
}

export interface Attachment {
  id: string;
  name: string;
  sizeKb: number;
  mime: string;
  url: string;
}

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

export interface ChatSendPayload {
  conversationId: string;
  senderId: string;
  body: string;
  attachments?: Attachment[];
  tempId: string;
  recipientIds?: string[];
}

export interface ChatAckPayload {
  tempId: string;
  message: Message;
}

export interface ChatTypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  recipientIds?: string[];
}

export interface ChatReadPayload {
  conversationId: string;
  userId: string;
  recipientIds?: string[];
}

export type CallKind = 'VOICE' | 'VIDEO' | 'LECTURE';
export type CallOutcome = 'COMPLETED' | 'MISSED' | 'DECLINED';

export interface CallRequestPayload {
  callId: string;
  callerId: string;
  callerName?: string;
  calleeId: string;
  kind: CallKind;
  roomId?: string;
}

export interface CallResponsePayload {
  callId: string;
  callerId: string;
  calleeId: string;
  accepted: boolean;
  reason?: string;
}

export interface CallEndPayload {
  callId: string;
  callerId: string;
  calleeId?: string;
  kind: CallKind;
  startedAt: string;
  endedAt: string;
  durationSec?: number;
  outcome: CallOutcome;
}

export interface WebRtcSignalPayload {
  targetUserId: string;
  senderUserId: string;
  signal: any;
  callId?: string;
}

export interface LectureJoinPayload {
  roomId: string;
  userId: string;
  name: string;
  role: string;
}

export interface LectureLeavePayload {
  roomId: string;
  userId: string;
}

export interface LectureParticipant {
  userId: string;
  name: string;
  role: string;
  isHandRaised: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  joinedAt: string;
}

export interface LectureHandPayload {
  roomId: string;
  userId: string;
  raised: boolean;
}

export interface LectureControlPayload {
  roomId: string;
  action: 'MUTE_ALL' | 'REMOVE_PARTICIPANT' | 'END_LECTURE';
  targetUserId?: string;
}
