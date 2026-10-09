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
  hostUserId: string;
  participants: Map<string, LectureParticipant>;
}

const lectureRooms = new Map<string, LectureRoom>();

export function registerLectureHandlers(io: Server, socket: Socket) {
  const currentUser = socket.data.user;

  // 1. Join lecture room
  socket.on('lecture:join', (payload: LectureJoinPayload) => {
    const roomId = payload.roomId;
    const userId = payload.userId || currentUser?.userId;
    const name = payload.name || currentUser?.email || 'Student';
    const role = payload.role || currentUser?.role || 'STUDENT';

    socket.join(`lecture:${roomId}`);

    if (!lectureRooms.has(roomId)) {
      lectureRooms.set(roomId, {
        roomId,
        hostUserId: userId,
        participants: new Map(),
      });
    }

    const room = lectureRooms.get(roomId)!;
    const participant: LectureParticipant = {
      userId,
      name,
      role,
      isHandRaised: false,
      isMuted: role === 'STUDENT', // Muted by default for students
      isCameraOff: role === 'STUDENT', // Cam off by default for students
      joinedAt: new Date().toISOString(),
    };

    room.participants.set(userId, participant);

    // Broadcast updated participant list to room
    const participantsList = Array.from(room.participants.values());
    io.to(`lecture:${roomId}`).emit('lecture:participants', {
      roomId,
      participants: participantsList,
    });
  });

  // 2. Leave lecture room
  socket.on('lecture:leave', (payload: LectureLeavePayload) => {
    const roomId = payload.roomId;
    const userId = payload.userId || currentUser?.userId;

    socket.leave(`lecture:${roomId}`);

    const room = lectureRooms.get(roomId);
    if (room) {
      room.participants.delete(userId);
      const participantsList = Array.from(room.participants.values());
      io.to(`lecture:${roomId}`).emit('lecture:participants', {
        roomId,
        participants: participantsList,
      });

      if (room.participants.size === 0) {
        lectureRooms.delete(roomId);
      }
    }
  });

  // 3. Raise / lower hand
  socket.on('lecture:hand', (payload: LectureHandPayload) => {
    const room = lectureRooms.get(payload.roomId);
    if (room && room.participants.has(payload.userId)) {
      const p = room.participants.get(payload.userId)!;
      p.isHandRaised = payload.raised;
      io.to(`lecture:${payload.roomId}`).emit('lecture:participants', {
        roomId: payload.roomId,
        participants: Array.from(room.participants.values()),
      });
    }
  });

  // 4. Faculty Moderation Controls
  socket.on('lecture:control', (payload: LectureControlPayload) => {
    const room = lectureRooms.get(payload.roomId);
    if (!room) return;

    // Verify host or faculty role
    const userRole = currentUser?.role;
    const isHost = room.hostUserId === currentUser?.userId;
    const isFaculty = userRole === 'FACULTY' || userRole === 'ADMIN' || userRole === 'HOD';

    if (!isHost && !isFaculty) {
      socket.emit('lecture:error', { message: 'Unauthorized to perform moderation actions' });
      return;
    }

    if (payload.action === 'MUTE_ALL') {
      room.participants.forEach((p) => {
        if (p.role === 'STUDENT') {
          p.isMuted = true;
        }
      });
      io.to(`lecture:${payload.roomId}`).emit('lecture:participants', {
        roomId: payload.roomId,
        participants: Array.from(room.participants.values()),
      });
      io.to(`lecture:${payload.roomId}`).emit('lecture:control', payload);
    } else if (payload.action === 'REMOVE_PARTICIPANT' && payload.targetUserId) {
      room.participants.delete(payload.targetUserId);
      io.to(`lecture:${payload.roomId}`).emit('lecture:participants', {
        roomId: payload.roomId,
        participants: Array.from(room.participants.values()),
      });
      io.to(`lecture:${payload.roomId}`).emit('lecture:control', payload);
    } else if (payload.action === 'END_LECTURE') {
      io.to(`lecture:${payload.roomId}`).emit('lecture:control', payload);
      lectureRooms.delete(payload.roomId);
    }
  });

  // Handle sudden socket disconnect
  socket.on('disconnect', () => {
    const userId = currentUser?.userId;
    if (!userId) return;

    lectureRooms.forEach((room, roomId) => {
      if (room.participants.has(userId)) {
        room.participants.delete(userId);
        io.to(`lecture:${roomId}`).emit('lecture:participants', {
          roomId,
          participants: Array.from(room.participants.values()),
        });
        if (room.participants.size === 0) {
          lectureRooms.delete(roomId);
        }
      }
    });
  });
}
