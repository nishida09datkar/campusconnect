import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginRequest, AuthResponse, User, ApiError } from '@/types';
import { authService } from '@/api/services/auth.service';
import { getAccessToken } from '@/api/axios';
import { getSessionHint } from '@/utils/storage';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  // A saved session is restored on startup; starting in 'loading' keeps route guards from redirecting to /login first.
  status: getSessionHint() ? 'loading' : 'idle',
  error: null,
};

export const loginUser = createAsyncThunk<AuthResponse, LoginRequest, { rejectValue: ApiError }>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (err) {
      return rejectWithValue(err as ApiError);
    }
  }
);

export const registerUser = createAsyncThunk<AuthResponse, Parameters<typeof authService.register>[0], { rejectValue: ApiError }>(
  'auth/registerUser',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await authService.register(formData);
      return response;
    } catch (err) {
      return rejectWithValue(err as ApiError);
    }
  }
);

export const loginWithGoogle = createAsyncThunk<AuthResponse, string, { rejectValue: ApiError }>(
  'auth/loginWithGoogle',
  async (idToken, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithGoogle(idToken);
      return response;
    } catch (err) {
      return rejectWithValue(err as ApiError);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk<User, void, { rejectValue: ApiError }>(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.fetchMe();
      return user;
    } catch (err) {
      return rejectWithValue(err as ApiError);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await authService.logout();
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setMockUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.accessToken = `mock-token-${action.payload.id}`;
      state.status = 'authenticated';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Login failed';
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Registration failed';
      })
      // Google Login
      .addCase(loginWithGoogle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Google Sign-In failed';
      })
      // Fetch me
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.accessToken = getAccessToken();
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.status = 'idle';
        state.user = null;
        state.accessToken = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const { clearError, setMockUser } = authSlice.actions;
export default authSlice.reducer;
