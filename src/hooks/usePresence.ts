import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  presenceReceived,
  fetchUsersPresence,
} from '@/features/presence/presenceSlice';
import { selectPresenceByUserId } from '@/features/presence/presenceSelectors';
import { useSocketEvent } from './useSocket';
import { PresenceState } from '@/types';

export function usePresence(userId?: string) {
  const dispatch = useAppDispatch();
  const presence = useAppSelector((state) =>
    userId ? selectPresenceByUserId(state, userId) : undefined
  );

  // Fetch initial presence if requested user is not in state
  useEffect(() => {
    if (userId && !presence) {
      dispatch(fetchUsersPresence([userId]));
    }
  }, [userId, presence, dispatch]);

  // Subscribe to real-time presence events from socket
  useSocketEvent('presence:update', (updated: PresenceState) => {
    dispatch(presenceReceived(updated));
  }, [dispatch]);

  return presence || {
    userId: userId || '',
    online: false,
    lastSeen: undefined,
  };
}

export function useBatchPresence(userIds: string[]) {
  const dispatch = useAppDispatch();
  const presenceMap = useAppSelector((state) => state.presence.byUserId);

  useEffect(() => {
    const missing = userIds.filter((id) => !presenceMap[id]);
    if (missing.length > 0) {
      dispatch(fetchUsersPresence(missing));
    }
  }, [userIds, presenceMap, dispatch]);

  useSocketEvent('presence:update', (updated: PresenceState) => {
    dispatch(presenceReceived(updated));
  }, [dispatch]);

  return presenceMap;
}
