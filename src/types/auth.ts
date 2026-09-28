export type Role = 'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
  avatarUrl?: string;
  isActive: boolean;
  rollNo?: string;
  year?: 1 | 2 | 3 | 4;
  division?: string; // students
  employeeId?: string;
  designation?: string; // faculty, HOD
}

export interface LoginRequest {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'failed';
  error: string | null;
}
