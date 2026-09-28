import { apiClient, setAccessToken } from '../axios';
import { USE_MOCKS } from '../config';
import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { AuthResponse, LoginRequest, User, ApiError } from '@/types';
import { setSessionHint, clearSessionHint, getSessionHint } from '@/utils/storage';

export const authService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    if (USE_MOCKS) {
      await delay(350, 600);
      const email = request.email.trim().toLowerCase();
      const user = db.users.find((u) => u.email.toLowerCase() === email);

      if (!user) {
        const error: ApiError = {
          status: 401,
          message: 'Invalid email or password',
        };
        throw error;
      }

      if (!user.isActive) {
        const error: ApiError = {
          status: 403,
          message: 'This account has been deactivated. Please contact your administrator.',
        };
        throw error;
      }

      // Generate a mock JWT
      const mockToken = `mock-jwt-token-for-${user.id}-${Date.now()}`;
      setAccessToken(mockToken);

      // Persist only non-sensitive session hint (Section 8.1 & 16)
      setSessionHint({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        accessToken: mockToken,
        user,
      };
    }

    const response = await apiClient.post<AuthResponse>('/api/auth/login', request);
    setAccessToken(response.data.accessToken);
    setSessionHint({
      userId: response.data.user.id,
      email: response.data.user.email,
      role: response.data.user.role,
    });
    return response.data;
  },

  async fetchMe(): Promise<User> {
    if (USE_MOCKS) {
      await delay(200, 400);
      const hint = getSessionHint();
      if (!hint) {
        const error: ApiError = {
          status: 401,
          message: 'No active session found',
        };
        throw error;
      }

      const user = db.users.find((u) => u.id === hint.userId);
      if (!user || !user.isActive) {
        clearSessionHint();
        setAccessToken(null);
        const error: ApiError = {
          status: 401,
          message: 'Session expired or user deactivated',
        };
        throw error;
      }

      // Re-establish mock in-memory token
      setAccessToken(`mock-jwt-restored-${user.id}`);
      return user;
    }

    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    if (USE_MOCKS) {
      await delay(150, 300);
      const hint = getSessionHint();
      if (!hint) throw { status: 401, message: 'Refresh failed' };
      const newToken = `mock-refreshed-jwt-${Date.now()}`;
      setAccessToken(newToken);
      return { accessToken: newToken };
    }

    const response = await apiClient.post<{ accessToken: string }>('/api/auth/refresh');
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  async logout(): Promise<void> {
    if (USE_MOCKS) {
      await delay(100, 200);
      setAccessToken(null);
      clearSessionHint();
      return;
    }

    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      setAccessToken(null);
      clearSessionHint();
    }
  },
};
