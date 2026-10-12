import { Server, Socket } from 'socket.io';
import {
  CallRequestPayload,
  CallResponsePayload,
  CallEndPayload,
  WebRtcSignalPayload,
} from '../types/socket.js';
import { userSocketMap } from './presenceHandler.js';

interface ActiveCall {
  callId: string;
  callerId: string;
  calleeId: string;
  kind: 'VOICE' | 'VIDEO' | 'LECTURE';
  startedAt: string;
  // The backend records whoever's token writes a log as its caller, so every log of this call is written with this one
  callerToken?: string;
  callerSocketId: string;
  // The callee device that accepted; unset while the call is still ringing
  calleeSocketId?: string;
}

const activeCalls = new Map<string, ActiveCall>();

function otherParty(call: ActiveCall, userId: string | undefined): string | null {
  if (call.callerId === userId) return call.calleeId;
  if (call.calleeId === userId) return call.callerId;
  return null;
}

export function registerCallHandlers(io: Server, socket: Socket, springBootUrl: string) {
  const currentUser = socket.data.user;
  const userId: string | undefined = currentUser?.userId;

  const emitToUser = (targetUserId: string, event: string, payload: unknown) => {
    userSocketMap.get(targetUserId)?.forEach((sockId) => {
      io.to(sockId).emit(event, payload);
    });
  };

  // 1. Call request initiation
  socket.on('call:request', async (payload: CallRequestPayload) => {
    // The caller is always the authenticated user, never an id supplied in the payload
    const callerId = userId;
    const calleeId = payload?.calleeId;

    if (!callerId || typeof calleeId !== 'string' || !calleeId || calleeId === callerId) {
      socket.emit('call:error', { message: 'Invalid call recipient' });
      return;
    }

    // Verify permission with Spring Boot if configured
    try {
      const token = socket.handshake.auth?.token;
      if (token && springBootUrl) {
        // Query Spring Boot to ensure interaction is permitted
        const checkUrl = `${springBootUrl}/api/users/${calleeId}/can-interact`;
        try {
          const res = await fetch(checkUrl, {
            headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
          });
          if (res.ok) {
            const data: any = await res.json();
            if (data && data.allowed === false) {
              socket.emit('call:error', {
                code: 'PERMISSION_DENIED',
                message: 'You are not permitted to call this user based on institutional policy',
              });
              return;
            }
          }
        } catch (fetchErr) {
          // If Spring Boot endpoint is offline or unavailable, proceed
        }
      }
    } catch (e) {
      // Non-blocking fallback
    }

    const callId = payload.callId || `call-${Date.now()}`;
    if (activeCalls.has(callId)) {
      socket.emit('call:error', { message: 'Call id is already in use' });
      return;
    }

    const calleeSockets = userSocketMap.get(calleeId);
    if (!calleeSockets || calleeSockets.size === 0) {
      // User is offline or unreachable
      socket.emit('call:response', {
        callId,
        callerId,
        calleeId,
        accepted: false,
        reason: 'User is offline',
      });
      return;
    }

    // Store active call metadata
    activeCalls.set(callId, {
      callId,
      callerId,
      calleeId,
      kind: payload.kind,
      startedAt: new Date().toISOString(),
      callerToken: socket.handshake.auth?.token,
      callerSocketId: socket.id,
    });

    emitToUser(calleeId, 'call:incoming', {
      ...payload,
      callId,
      callerId,
      callerName: payload.callerName || currentUser?.email || 'CampusConnect User',
    });
  });

  // 2. Call response (accept / decline)
  socket.on('call:response', (payload: CallResponsePayload) => {
    const call = payload?.callId ? activeCalls.get(payload.callId) : undefined;
    // Only the callee of a registered call may answer it
    if (!call || call.calleeId !== userId) return;
    // Only the first answer counts: another device of the callee may still time out or decline afterwards
    if (call.calleeSocketId) return;

    const response: CallResponsePayload = {
      callId: call.callId,
      callerId: call.callerId,
      calleeId: call.calleeId,
      accepted: payload.accepted === true,
      reason: payload.reason,
    };
    emitToUser(call.callerId, 'call:response', response);

    if (response.accepted) {
      call.calleeSocketId = socket.id;
      // Stop the callee's other devices ringing
      userSocketMap.get(call.calleeId)?.forEach((sockId) => {
        if (sockId !== socket.id) {
          io.to(sockId).emit('call:cancel', { callId: call.callId, calleeId: call.calleeId });
        }
      });
    } else {
      activeCalls.delete(call.callId);
      // Record as DECLINED or MISSED
      const outcome = payload.reason === 'Timeout' ? 'MISSED' : 'DECLINED';
      saveCallLogToBackend(springBootUrl, call.callerToken, {
        callId: call.callId,
        callerId: call.callerId,
        calleeId: call.calleeId,
        kind: call.kind,
        startedAt: call.startedAt,
        endedAt: new Date().toISOString(),
        durationSec: 0,
        outcome,
      });
    }
  });

  // 3. Call cancel by caller
  socket.on('call:cancel', (payload: { callId: string; calleeId: string }) => {
    const call = payload?.callId ? activeCalls.get(payload.callId) : undefined;
    if (!call || call.callerId !== userId) return;

    emitToUser(call.calleeId, 'call:cancel', { callId: call.callId, calleeId: call.calleeId });
    activeCalls.delete(call.callId);
    saveCallLogToBackend(springBootUrl, call.callerToken, {
      callId: call.callId,
      callerId: call.callerId,
      calleeId: call.calleeId,
      kind: call.kind,
      startedAt: call.startedAt,
      endedAt: new Date().toISOString(),
      durationSec: 0,
      outcome: 'MISSED',
    });
  });

  // 4. Call end by either party
  socket.on('call:end', async (payload: CallEndPayload) => {
    const call = payload?.callId ? activeCalls.get(payload.callId) : undefined;
    const peerId = call ? otherParty(call, userId) : null;
    if (!call || !peerId) return;

    const ended: CallEndPayload = {
      ...payload,
      callId: call.callId,
      callerId: call.callerId,
      calleeId: call.calleeId,
      kind: call.kind,
    };
    emitToUser(peerId, 'call:ended', ended);
    activeCalls.delete(call.callId);

    await saveCallLogToBackend(springBootUrl, call.callerToken, ended);
  });

  // 5. WebRTC signaling relays, only between the two parties of a registered call
  const relaySignal = (event: 'webrtc:offer' | 'webrtc:answer' | 'webrtc:ice') => {
    socket.on(event, (payload: WebRtcSignalPayload) => {
      const call = payload?.callId ? activeCalls.get(payload.callId) : undefined;
      const peerId = call ? otherParty(call, userId) : null;
      if (!peerId || peerId !== payload.targetUserId) return;

      emitToUser(peerId, event, { ...payload, senderUserId: userId });
    });
  };
  relaySignal('webrtc:offer');
  relaySignal('webrtc:answer');
  relaySignal('webrtc:ice');

  // 6. A device in a call went away: release the call and tell the other party
  socket.on('disconnect', () => {
    activeCalls.forEach((call) => {
      const answered = Boolean(call.calleeSocketId);
      const ended: CallEndPayload = {
        callId: call.callId,
        callerId: call.callerId,
        calleeId: call.calleeId,
        kind: call.kind,
        startedAt: call.startedAt,
        endedAt: new Date().toISOString(),
        outcome: answered ? 'COMPLETED' : 'MISSED',
      };

      if (call.callerSocketId === socket.id) {
        emitToUser(call.calleeId, answered ? 'call:ended' : 'call:cancel', ended);
      } else if (call.calleeSocketId === socket.id) {
        emitToUser(call.callerId, 'call:ended', ended);
      } else if (!answered && call.calleeId === userId && !hasOtherSocket(userId, socket.id)) {
        emitToUser(call.callerId, 'call:response', {
          callId: call.callId,
          callerId: call.callerId,
          calleeId: call.calleeId,
          accepted: false,
          reason: 'User is offline',
        });
      } else {
        return;
      }

      activeCalls.delete(call.callId);
      saveCallLogToBackend(springBootUrl, call.callerToken, answered ? ended : { ...ended, durationSec: 0 });
    });
  });
}

function hasOtherSocket(userId: string, socketId: string): boolean {
  const sockets = userSocketMap.get(userId);
  return sockets ? [...sockets].some((id) => id !== socketId) : false;
}

async function saveCallLogToBackend(
  springBootUrl: string,
  token: string | undefined,
  payload: CallEndPayload
) {
  if (!springBootUrl) return;

  try {
    const started = new Date(payload.startedAt).getTime();
    const ended = new Date(payload.endedAt).getTime();
    const duration = payload.durationSec ?? Math.max(0, Math.round((ended - started) / 1000));

    const reqBody = {
      callerId: payload.callerId,
      calleeId: payload.calleeId,
      kind: payload.kind,
      startedAt: payload.startedAt,
      endedAt: payload.endedAt,
      durationSec: duration,
      outcome: payload.outcome || 'COMPLETED',
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    await fetch(`${springBootUrl}/api/calls/logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody),
    });
  } catch (err: any) {
    console.warn('[Signaling] Failed to persist call log to Spring Boot:', err.message);
  }
}
