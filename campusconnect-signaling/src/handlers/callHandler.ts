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
}

const activeCalls = new Map<string, ActiveCall>();

export function registerCallHandlers(io: Server, socket: Socket, springBootUrl: string) {
  const currentUser = socket.data.user;

  // 1. Call request initiation
  socket.on('call:request', async (payload: CallRequestPayload) => {
    const callerId = payload.callerId || currentUser?.userId;
    const calleeId = payload.calleeId;

    if (!calleeId || calleeId === callerId) {
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

    // Store active call metadata
    const callId = payload.callId || `call-${Date.now()}`;
    activeCalls.set(callId, {
      callId,
      callerId,
      calleeId,
      kind: payload.kind,
      startedAt: new Date().toISOString(),
    });

    const incomingPayload = {
      ...payload,
      callId,
      callerId,
      callerName: payload.callerName || currentUser?.email || 'CampusConnect User',
    };

    // Forward to target user's active sockets
    const calleeSockets = userSocketMap.get(calleeId);
    if (calleeSockets && calleeSockets.size > 0) {
      calleeSockets.forEach((sockId) => {
        io.to(sockId).emit('call:incoming', incomingPayload);
      });
    } else {
      // User is offline or unreachable
      socket.emit('call:response', {
        callId,
        callerId,
        calleeId,
        accepted: false,
        reason: 'User is offline',
      });
    }
  });

  // 2. Call response (accept / decline)
  socket.on('call:response', (payload: CallResponsePayload) => {
    const callerSockets = userSocketMap.get(payload.callerId);
    if (callerSockets) {
      callerSockets.forEach((sockId) => {
        io.to(sockId).emit('call:response', payload);
      });
    }

    if (!payload.accepted && payload.callId) {
      const call = activeCalls.get(payload.callId);
      if (call) {
        activeCalls.delete(payload.callId);
        // Record as DECLINED or MISSED
        const outcome = payload.reason === 'Timeout' ? 'MISSED' : 'DECLINED';
        saveCallLogToBackend(springBootUrl, socket.handshake.auth?.token, {
          callId: payload.callId,
          callerId: payload.callerId,
          calleeId: payload.calleeId,
          kind: call.kind,
          startedAt: call.startedAt,
          endedAt: new Date().toISOString(),
          durationSec: 0,
          outcome,
        });
      }
    }
  });

  // 3. Call cancel by caller
  socket.on('call:cancel', (payload: { callId: string; calleeId: string }) => {
    const calleeSockets = userSocketMap.get(payload.calleeId);
    if (calleeSockets) {
      calleeSockets.forEach((sockId) => {
        io.to(sockId).emit('call:cancel', payload);
      });
    }
    const call = activeCalls.get(payload.callId);
    if (call) {
      activeCalls.delete(payload.callId);
      saveCallLogToBackend(springBootUrl, socket.handshake.auth?.token, {
        callId: payload.callId,
        callerId: call.callerId,
        calleeId: call.calleeId,
        kind: call.kind,
        startedAt: call.startedAt,
        endedAt: new Date().toISOString(),
        durationSec: 0,
        outcome: 'MISSED',
      });
    }
  });

  // 4. Call end by either party
  socket.on('call:end', async (payload: CallEndPayload) => {
    const targetUserId = payload.callerId === currentUser?.userId ? payload.calleeId : payload.callerId;
    if (targetUserId) {
      const targetSockets = userSocketMap.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach((sockId) => {
          io.to(sockId).emit('call:ended', payload);
        });
      }
    }

    // Clean up active call and save log to Spring Boot
    if (payload.callId) {
      activeCalls.delete(payload.callId);
    }

    await saveCallLogToBackend(springBootUrl, socket.handshake.auth?.token, payload);
  });

  // 5. WebRTC Signaling Relays
  socket.on('webrtc:offer', (payload: WebRtcSignalPayload) => {
    const targetSockets = userSocketMap.get(payload.targetUserId);
    if (targetSockets) {
      targetSockets.forEach((sockId) => {
        io.to(sockId).emit('webrtc:offer', {
          ...payload,
          senderUserId: currentUser?.userId,
        });
      });
    }
  });

  socket.on('webrtc:answer', (payload: WebRtcSignalPayload) => {
    const targetSockets = userSocketMap.get(payload.targetUserId);
    if (targetSockets) {
      targetSockets.forEach((sockId) => {
        io.to(sockId).emit('webrtc:answer', {
          ...payload,
          senderUserId: currentUser?.userId,
        });
      });
    }
  });

  socket.on('webrtc:ice', (payload: WebRtcSignalPayload) => {
    const targetSockets = userSocketMap.get(payload.targetUserId);
    if (targetSockets) {
      targetSockets.forEach((sockId) => {
        io.to(sockId).emit('webrtc:ice', {
          ...payload,
          senderUserId: currentUser?.userId,
        });
      });
    }
  });
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
