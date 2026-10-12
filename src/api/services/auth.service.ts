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
    // Keep local cache synchronized with live MySQL user data
    const idx = db.users.findIndex((u) => u.id === authData.user.id);
    if (idx !== -1) {
      db.users[idx] = { ...authData.user };
    } else {
      db.users.push({ ...authData.user });
    }
    return authData;
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    departmentId?: string;
    rollNo?: string;
    year?: number;
    division?: string;
  }): Promise<AuthResponse> {
    if (USE_MOCKS) {
      await delay(350, 600);
      const email = data.email.trim().toLowerCase();
      const existing = db.users.find((u) => u.email.toLowerCase() === email);
      if (existing) {
        throw { status: 400, message: `Account with email '${email}' already exists.` };
      }
      const role = data.role || 'STUDENT';
      const idPrefix = role.toLowerCase();
      const newUser: User = {
        id: `user-${idPrefix}-${Date.now().toString().slice(-6)}`,
        name: data.name.trim(),
        email,
        role,
        departmentId: data.departmentId,
        isActive: true,
        rollNo: data.rollNo,
        year: data.year as 1 | 2 | 3 | 4 | undefined,
        division: data.division,
      };
      db.users.push(newUser);
      const mockToken = `mock-jwt-token-for-${newUser.id}-${Date.now()}`;
      setAccessToken(mockToken);
      setSessionHint({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });
      return { accessToken: mockToken, user: newUser };
    }

    const response = await apiClient.post<BackendAuthData>('/api/auth/register', data);
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
    const remoteUser = response.data;
    const idx = db.users.findIndex((u) => u.id === remoteUser.id);
    if (idx !== -1) {
      db.users[idx] = { ...remoteUser };
    } else {
      db.users.push({ ...remoteUser });
    }
    return remoteUser;
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
