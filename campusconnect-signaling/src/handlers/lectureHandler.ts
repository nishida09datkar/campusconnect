import { Server, Socket } from 'socket.io';
import {
  LectureJoinPayload,
  LectureLeavePayload,
  LectureParticipant,
  LectureHandPayload,
  LectureControlPayload,
} from '../types/socket.js';

interface LectureRoom {
  roomId: string;
  participants: Map<string, LectureParticipant>;
  // The sockets each participant joined from: a user stays in the lecture until the last of them is gone
  socketIds: Map<string, Set<string>>;
}

const lectureRooms = new Map<string, LectureRoom>();

const STAFF_ROLES = ['FACULTY', 'HOD', 'ADMIN'];
const MAX_NAME_LENGTH = 100;

const channel = (roomId: string) => `lecture:${roomId}`;

function isRoomId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 200;
}

export function registerLectureHandlers(io: Server, socket: Socket) {
  const currentUser = socket.data.user;
  // Identity and role always come from the verified token, never from a payload
  const userId: string | undefined = currentUser?.userId;
  const role: string = currentUser?.role || 'STUDENT';
  const isStaff = STAFF_ROLES.includes(role);

  const broadcastParticipants = (room: LectureRoom) => {
    io.to(channel(room.roomId)).emit('lecture:participants', {
      roomId: room.roomId,
      participants: Array.from(room.participants.values()),
    });
  };

  // Takes this socket out of the room; the user goes with it only when it was their last one there
  const leaveRoom = (room: LectureRoom) => {
    if (!userId) return;
    const sockets = room.socketIds.get(userId);
    if (!sockets || !sockets.delete(socket.id)) return;

    socket.leave(channel(room.roomId));
    if (sockets.size > 0) return;

    room.socketIds.delete(userId);
    room.participants.delete(userId);
    broadcastParticipants(room);
    if (room.participants.size === 0) {
      lectureRooms.delete(room.roomId);
    }
  };

  // 1. Join lecture room
  socket.on('lecture:join', (payload: LectureJoinPayload) => {
    const roomId = payload?.roomId;
    if (!userId || !isRoomId(roomId)) return;

    const name =
      typeof payload.name === 'string' && payload.name.trim()
        ? payload.name.trim().slice(0, MAX_NAME_LENGTH)
        : currentUser?.email || 'Student';

    socket.join(channel(roomId));

    let room = lectureRooms.get(roomId);
    if (!room) {
      room = { roomId, participants: new Map(), socketIds: new Map() };
      lectureRooms.set(roomId, room);
    }

    if (!room.socketIds.has(userId)) {
      room.socketIds.set(userId, new Set());
    }
    room.socketIds.get(userId)!.add(socket.id);

    // Joining again from another tab keeps the state (e.g. a raised hand) the user already has
    if (!room.participants.has(userId)) {
      room.participants.set(userId, {
        userId,
        name,
        role,
        isHandRaised: false,
        isMuted: role === 'STUDENT', // Muted by default for students
        isCameraOff: role === 'STUDENT', // Cam off by default for students
        joinedAt: new Date().toISOString(),
      });
    }

    // Broadcast updated participant list to room
    broadcastParticipants(room);
  });

  // 2. Leave lecture room (only ever oneself)
  socket.on('lecture:leave', (payload: LectureLeavePayload) => {
    const room = isRoomId(payload?.roomId) ? lectureRooms.get(payload.roomId) : undefined;
    if (room) leaveRoom(room);
  });

  // 3. Raise / lower hand
  socket.on('lecture:hand', (payload: LectureHandPayload) => {
    const room = isRoomId(payload?.roomId) ? lectureRooms.get(payload.roomId) : undefined;
    if (!room || !userId || typeof payload.raised !== 'boolean') return;

    // Students control their own hand; staff may also lower somebody else's
    const targetUserId = isStaff && typeof payload.userId === 'string' ? payload.userId : userId;
    if (!isStaff && payload.userId && payload.userId !== userId) return;

    const participant = room.participants.get(targetUserId);
    if (!participant) return;

    participant.isHandRaised = payload.raised;
    broadcastParticipants(room);
  });

  // 4. Faculty Moderation Controls
  socket.on('lecture:control', (payload: LectureControlPayload) => {
    const room = isRoomId(payload?.roomId) ? lectureRooms.get(payload.roomId) : undefined;
    if (!room) return;

    if (!isStaff) {
      socket.emit('lecture:error', { message: 'Unauthorized to perform moderation actions' });
      return;
    }

    if (payload.action === 'MUTE_ALL') {
      room.participants.forEach((p) => {
        if (p.role === 'STUDENT') {
          p.isMuted = true;
        }
      });
      broadcastParticipants(room);
      io.to(channel(room.roomId)).emit('lecture:control', payload);
    } else if (payload.action === 'REMOVE_PARTICIPANT' && typeof payload.targetUserId === 'string') {
      // Tell the room first, so the removed participant still hears about it, then cut them off
      io.to(channel(room.roomId)).emit('lecture:control', payload);
      room.socketIds.get(payload.targetUserId)?.forEach((sockId) => {
        io.in(sockId).socketsLeave(channel(room.roomId));
      });
      room.socketIds.delete(payload.targetUserId);
      room.participants.delete(payload.targetUserId);
      broadcastParticipants(room);
      if (room.participants.size === 0) {
        lectureRooms.delete(room.roomId);
      }
    } else if (payload.action === 'END_LECTURE') {
      io.to(channel(room.roomId)).emit('lecture:control', payload);
      io.in(channel(room.roomId)).socketsLeave(channel(room.roomId));
      lectureRooms.delete(room.roomId);
    }
  });

  // Handle sudden socket disconnect
  socket.on('disconnect', () => {
    lectureRooms.forEach((room) => leaveRoom(room));
  });
}
