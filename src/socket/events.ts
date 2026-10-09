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
  senderUserId?: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit | any;
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

export interface LectureParticipantsPayload {
  roomId: string;
  participants: LectureParticipant[];
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

export interface SocketEventMap {
  'chat:send': (payload: ChatSendPayload) => void;
  'chat:ack': (payload: ChatAckPayload) => void;
  'chat:message': (payload: Message) => void;
  'chat:typing': (payload: ChatTypingPayload) => void;
  'chat:read': (payload: ChatReadPayload) => void;
  'presence:update': (payload: PresenceState) => void;
  'call:request': (payload: CallRequestPayload) => void;
  'call:incoming': (payload: CallRequestPayload) => void;
  'call:response': (payload: CallResponsePayload) => void;
  'call:cancel': (payload: { callId: string; calleeId: string }) => void;
  'call:end': (payload: CallEndPayload) => void;
  'call:ended': (payload: CallEndPayload) => void;
  'call:error': (payload: { message: string; code?: string }) => void;
  'webrtc:offer': (payload: WebRtcSignalPayload) => void;
  'webrtc:answer': (payload: WebRtcSignalPayload) => void;
  'webrtc:ice': (payload: WebRtcSignalPayload) => void;
  'lecture:join': (payload: LectureJoinPayload) => void;
  'lecture:leave': (payload: LectureLeavePayload) => void;
  'lecture:participants': (payload: LectureParticipantsPayload) => void;
  'lecture:hand': (payload: LectureHandPayload) => void;
  'lecture:control': (payload: LectureControlPayload) => void;
  'lecture:error': (payload: { message: string }) => void;
  'connect': () => void;
  'disconnect': (reason?: string) => void;
}

export type SocketEventName = keyof SocketEventMap;
