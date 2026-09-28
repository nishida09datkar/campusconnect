import { Role } from '@/types';

export const ROLE_HOME_ROUTES: Record<Role, string> = {
  ADMIN: '/admin',
  HOD: '/hod',
  FACULTY: '/faculty',
  STUDENT: '/student',
};

export const getRoleHomeRoute = (role?: Role): string => {
  if (!role) return '/login';
  return ROLE_HOME_ROUTES[role] || '/login';
};
