import { describe, it, expect } from 'vitest';
import authReducer, { clearError, setMockUser } from '@/features/auth/authSlice';
import { authService } from '@/api/services/auth.service';
import { db } from '@/api/mock/db';

describe('Auth Service and Redux Slice Unit Tests', () => {
  it('Initial state is idle with no user and no token in memory', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  it('setMockUser correctly updates user and switches status to authenticated', () => {
    const mockUser = db.users[0]; // Admin
    const state = authReducer(undefined, setMockUser(mockUser));
    expect(state.user?.id).toBe(mockUser.id);
    expect(state.status).toBe('authenticated');
    expect(state.accessToken).toBeTruthy();
  });

  it('clearError clears existing auth error', () => {
    const stateWithError = {
      user: null,
      accessToken: null,
      status: 'failed' as const,
      error: 'Invalid password',
    };
    const nextState = authReducer(stateWithError, clearError());
    expect(nextState.error).toBeNull();
  });

  it('Mock login successfully logs in Admin and returns token and user profile', async () => {
    const res = await authService.login({
      email: 'admin@campus.test',
      password: 'any-password',
    });
    expect(res.user.email).toBe('admin@campus.test');
    expect(res.user.role).toBe('ADMIN');
    expect(res.accessToken).toContain('mock-jwt-token');
  });

  it('Mock login successfully logs in Faculty and returns FACULTY role', async () => {
    const res = await authService.login({
      email: 'neha@campus.test',
      password: 'any-password',
    });
    expect(res.user.name).toBe('Prof. Neha Kulkarni');
    expect(res.user.role).toBe('FACULTY');
  });

  it('Mock login fails with non-existent user email', async () => {
    await expect(
      authService.login({
        email: 'nobody@campus.test',
        password: 'password',
      })
    ).rejects.toEqual(
      expect.objectContaining({
        status: 401,
        message: 'Invalid email or password',
      })
    );
  });

  it('fetchMe restores active user profile from session hint', async () => {
    // First login as Admin to set session hint
    await authService.login({
      email: 'admin@campus.test',
      password: 'any-password',
    });

    const user = await authService.fetchMe();
    expect(user.email).toBe('admin@campus.test');
    expect(user.role).toBe('ADMIN');
  });

  it('refreshToken generates fresh access token', async () => {
    await authService.login({
      email: 'admin@campus.test',
      password: 'any-password',
    });

    const refreshRes = await authService.refreshToken();
    expect(refreshRes.accessToken).toContain('mock-refreshed-jwt');
  });

  it('logout clears session hint and access token', async () => {
    await authService.login({
      email: 'admin@campus.test',
      password: 'any-password',
    });

    await authService.logout();
    await expect(authService.fetchMe()).rejects.toEqual(
      expect.objectContaining({
        status: 401,
      })
    );
  });
});
