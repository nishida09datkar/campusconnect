import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { User, AuthState } from '@/types';

const createMockStore = (user: User | null) => {
  const authState: AuthState = {
    user,
    accessToken: user ? 'mock-token' : null,
    status: user ? 'authenticated' : 'idle',
    error: null,
  };

  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState: {
      auth: authState,
      ui: {
        theme: 'light' as const,
        sidebarCollapsed: false,
        mobileDrawerOpen: false,
        toasts: [],
      },
    },
  });
};

describe('ProtectedRoute Access Control Tests', () => {
  it('Redirects unauthenticated visitors to /login', () => {
    const store = createMockStore(null);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<div>Admin Secret Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Dashboard')).not.toBeInTheDocument();
  });

  it('Redirects authenticated student trying to access admin route to /403', () => {
    const studentUser: User = {
      id: 'stu-1',
      name: 'Aryan',
      email: 'student1@campus.test',
      role: 'STUDENT',
      isActive: true,
    };
    const store = createMockStore(studentUser);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/403" element={<div>403 Forbidden Page Mock</div>} />
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<div>Admin Secret Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('403 Forbidden Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Dashboard')).not.toBeInTheDocument();
  });

  it('Allows ADMIN role to access /admin route', () => {
    const adminUser: User = {
      id: 'admin-1',
      name: 'Aarav Mehta',
      email: 'admin@campus.test',
      role: 'ADMIN',
      isActive: true,
    };
    const store = createMockStore(adminUser);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<div>Admin Secret Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Admin Secret Dashboard')).toBeInTheDocument();
  });
});
