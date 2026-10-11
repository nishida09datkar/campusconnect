import { apiClient, setAccessToken, getAccessToken } from '../axios';
import { USE_MOCKS } from '../config';
import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { AuthResponse, LoginRequest, User, ApiError, Role } from '@/types';
import { setSessionHint, clearSessionHint, getSessionHint } from '@/utils/storage';

interface BackendAuthData {
  token?: string;
  accessToken?: string;
  userId?: string;
  email?: string;
  name?: string;
  role?: Role;
  departmentId?: string;
  user?: User;
}

function normalizeAuthResponse(data: BackendAuthData): AuthResponse {
  const accessToken = data.accessToken || data.token || '';
  if (data.user) {
    return { accessToken, user: data.user };
  }
  const user: User = {
    id: data.userId || 'user-unknown',
    name: data.name || 'User',
    email: data.email || '',
    role: data.role || 'STUDENT',
    departmentId: data.departmentId,
    isActive: true,
  };
  return { accessToken, user };
}

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

    const response = await apiClient.post<BackendAuthData>('/api/auth/login', request);
    const authData = normalizeAuthResponse(response.data);
    setAccessToken(authData.accessToken);
    setSessionHint({
      userId: authData.user.id,
      email: authData.user.email,
      role: authData.user.role,
    });
    return authData;
  },

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<BackendAuthData>('/api/auth/google', { idToken });
      const authData = normalizeAuthResponse(response.data);
      setAccessToken(authData.accessToken);
      setSessionHint({
        userId: authData.user.id,
        email: authData.user.email,
        role: authData.user.role,
      });
      return authData;
    } catch (err: unknown) {
      if (USE_MOCKS) {
        await delay(300, 500);
        const student = db.users.find((u) => u.role === 'STUDENT') || db.users[0];
        const mockToken = `mock-google-jwt-token-for-${student.id}-${Date.now()}`;
        setAccessToken(mockToken);
        setSessionHint({
          userId: student.id,
          email: student.email,
          role: student.role,
        });
        return { accessToken: mockToken, user: student };
      }
      throw err;
    }
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

    const token = getAccessToken();
    if (!token) {
      clearSessionHint();
      const error: ApiError = {
        status: 401,
        message: 'No active session token found',
      };
      throw error;
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
