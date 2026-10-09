import { Server, Socket } from 'socket.io';
import { PresenceState } from '../types/socket.js';

// Map of userId -> Set of active socket IDs
export const userSocketMap = new Map<string, Set<string>>();

export function registerPresenceHandlers(io: Server, socket: Socket) {
  const user = socket.data.user;
  if (!user || !user.userId) return;

  const userId = user.userId;

  // Add socket to user's set
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId)!.add(socket.id);

  // Broadcast online presence state
  const onlineState: PresenceState = {
    userId,
    online: true,
    lastSeen: new Date().toISOString(),
  };
  socket.broadcast.emit('presence:update', onlineState);

  // Listen for custom presence queries or heartbeats
  socket.on('presence:query', (targetUserId: string, callback?: (state: PresenceState) => void) => {
    const isOnline = userSocketMap.has(targetUserId) && userSocketMap.get(targetUserId)!.size > 0;
    const state: PresenceState = {
      userId: targetUserId,
      online: isOnline,
      lastSeen: new Date().toISOString(),
    };
    if (typeof callback === 'function') {
      callback(state);
    } else {
      socket.emit('presence:update', state);
    }
  });

  socket.on('disconnect', () => {
    const sockets = userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSocketMap.delete(userId);
        const offlineState: PresenceState = {
          userId,
          online: false,
          lastSeen: new Date().toISOString(),
        };
        io.emit('presence:update', offlineState);
      }
    }
  });
}
