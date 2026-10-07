import { RootState } from '@/store/store';
import { PresenceState } from '@/types';

export const selectPresenceByUserId = (state: RootState, userId: string): PresenceState | undefined =>
  state.presence.byUserId[userId];

export const selectAllPresence = (state: RootState): Record<string, PresenceState> =>
  state.presence.byUserId;
