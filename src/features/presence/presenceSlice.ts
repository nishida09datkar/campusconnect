import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PresenceState } from '@/types';
import { presenceService } from '@/api/services/presence.service';

interface PresenceSliceState {
  byUserId: Record<string, PresenceState>;
  loading: boolean;
}

const initialState: PresenceSliceState = {
  byUserId: {},
  loading: false,
};

export const fetchUsersPresence = createAsyncThunk(
  'presence/fetchUsersPresence',
  async (userIds: string[]) => {
    return await presenceService.getUsersPresence(userIds);
  }
);

export const updateCurrentUserPresence = createAsyncThunk(
  'presence/updateCurrentUserPresence',
  async ({ userId, online }: { userId: string; online: boolean }) => {
    return await presenceService.setPresence(userId, online);
  }
);

export const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    presenceReceived: (state, action: PayloadAction<PresenceState>) => {
      state.byUserId[action.payload.userId] = action.payload;
    },
    batchPresenceReceived: (state, action: PayloadAction<PresenceState[]>) => {
      action.payload.forEach((p) => {
        state.byUserId[p.userId] = p;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsersPresence.fulfilled, (state, action) => {
        action.payload.forEach((p) => {
          state.byUserId[p.userId] = p;
        });
      })
      .addCase(updateCurrentUserPresence.fulfilled, (state, action) => {
        state.byUserId[action.payload.userId] = action.payload;
      });
  },
});

export const { presenceReceived, batchPresenceReceived } = presenceSlice.actions;
export default presenceSlice.reducer;
