import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { PresenceState } from '@/types';

type PresenceListener = (presence: PresenceState) => void;
const presenceListeners = new Set<PresenceListener>();

// Initial in-memory presence directory seeded from DB users
const userPresenceMap = new Map<string, PresenceState>();

function initializePresence() {
  db.users.forEach((user) => {
    // Seed some active users as online
    const isOnline = ['user-hod-ce', 'user-fac-neha', 'user-stu-1'].includes(user.id);
    userPresenceMap.set(user.id, {
      userId: user.id,
      online: isOnline,
      lastSeen: isOnline ? undefined : new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    });
  });
}

// Initial seeding
initializePresence();

export const presenceService = {
  /**
   * Subscribe to real-time presence changes
   */
  subscribe(listener: PresenceListener): () => void {
    presenceListeners.add(listener);
    return () => {
      presenceListeners.delete(listener);
    };
  },

  /**
   * Broadcast presence update to local subscribers
   */
  emitChange(presence: PresenceState): void {
    userPresenceMap.set(presence.userId, presence);
    presenceListeners.forEach((listener) => {
      try {
        listener(presence);
      } catch (err) {
        console.error('Presence subscriber error:', err);
      }
    });
  },

  /**
   * Get presence for a single user
   */
  async getUserPresence(userId: string): Promise<PresenceState> {
    await delay(20, 50);
    const presence = userPresenceMap.get(userId);
    if (!presence) {
      return {
        userId,
        online: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      };
    }
    return { ...presence };
  },

  /**
   * Get presence for a list of users
   */
  async getUsersPresence(userIds: string[]): Promise<PresenceState[]> {
    await delay(30, 70);
    return userIds.map((id) => {
      const p = userPresenceMap.get(id);
      if (p) return { ...p };
      return {
        userId: id,
        online: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      };
    });
  },

  /**
   * Update presence for a user (e.g. current user connecting/disconnecting)
   */
  async setPresence(userId: string, online: boolean): Promise<PresenceState> {
    await delay(30, 80);
    const updated: PresenceState = {
      userId,
      online,
      lastSeen: online ? undefined : new Date().toISOString(),
    };
    userPresenceMap.set(userId, updated);
    this.emitChange(updated);
    return { ...updated };
  },

  /**
   * Reset presence map to seed values
   */
  reset(): void {
    userPresenceMap.clear();
    initializePresence();
  },
};
