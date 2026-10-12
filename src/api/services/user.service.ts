import { apiClient } from '../axios';
import { USE_MOCKS } from '../config';
import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { User, Role, PaginatedResponse } from '@/types';

export interface UserFilterParams {
  role?: Role;
  departmentId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export const userService = {
  async getUsers(params: UserFilterParams = {}): Promise<PaginatedResponse<User>> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<User[]>('/api/users', {
        params: {
          role: params.role,
          departmentId: params.departmentId,
        },
      });
      let users = res.data;
      if (params.q && params.q.trim()) {
        const search = params.q.trim().toLowerCase();
        users = users.filter(
          (u) =>
            u.name?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search)
        );
      }
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const total = users.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedItems = users.slice(startIndex, startIndex + pageSize);

      return {
        items: paginatedItems,
        total,
        page,
        pageSize,
      };
    }

    await delay(70, 150);
    const { role, departmentId, q, page = 1, pageSize = 20 } = params;

    let filtered = [...db.users];

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (departmentId) {
      filtered = filtered.filter((u) => u.departmentId === departmentId);
    }

    if (q && q.trim()) {
      const search = q.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.rollNo && u.rollNo.toLowerCase().includes(search)) ||
          (u.employeeId && u.employeeId.toLowerCase().includes(search)) ||
          (u.designation && u.designation.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems.map((u) => ({ ...u })),
      total,
      page,
      pageSize,
    };
  },

  async getUserById(id: string): Promise<User | null> {
    if (!USE_MOCKS) {
      try {
        const res = await apiClient.get<User>(`/api/users/${id}`);
        return res.data;
      } catch (err: any) {
        if (err.status === 404) return null;
        throw err;
      }
    }

    await delay(40, 90);
    const user = db.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  },

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    await delay(120, 250);

    const email = data.email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      throw { status: 400, message: `User with email '${email}' already exists.` };
    }

    const idPrefix =
      data.role === 'ADMIN'
        ? 'admin'
        : data.role === 'HOD'
        ? 'hod'
        : data.role === 'FACULTY'
        ? 'fac'
        : 'stu';

    const newUser: User = {
      ...data,
      id: `user-${idPrefix}-${Date.now().toString().slice(-6)}`,
      email,
      name: data.name.trim(),
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    db.users.push(newUser);
    return { ...newUser };
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await delay(100, 200);
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw { status: 404, message: 'User not found' };
    }

    if (updates.email) {
      const email = updates.email.trim().toLowerCase();
      const duplicate = db.users.find(
        (u) => u.id !== id && u.email.toLowerCase() === email
      );
      if (duplicate) {
        throw { status: 400, message: `Email '${email}' is already in use.` };
      }
      updates.email = email;
    }

    db.users[index] = {
      ...db.users[index],
      ...updates,
    };

    return { ...db.users[index] };
  },

  async toggleUserStatus(id: string, isActive?: boolean): Promise<User> {
    await delay(80, 160);
    const user = db.users.find((u) => u.id === id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    user.isActive = isActive !== undefined ? isActive : !user.isActive;
    return { ...user };
  },

  async getDepartmentFaculty(departmentId: string): Promise<User[]> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<User[]>('/api/users', {
        params: { role: 'FACULTY', departmentId },
      });
      return res.data;
    }

    await delay(50, 110);
    return db.users
      .filter((u) => u.departmentId === departmentId && u.role === 'FACULTY')
      .map((u) => ({ ...u }));
  },

  async getDepartmentStudents(departmentId: string): Promise<User[]> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<User[]>('/api/users', {
        params: { role: 'STUDENT', departmentId },
      });
      return res.data;
    }

    await delay(50, 110);
    return db.users
      .filter((u) => u.departmentId === departmentId && u.role === 'STUDENT')
      .map((u) => ({ ...u }));
  },

  async getPotentialHods(): Promise<User[]> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<User[]>('/api/users');
      return res.data.filter((u) => u.role === 'HOD' || u.role === 'FACULTY');
    }

    await delay(40, 90);
    return db.users
      .filter((u) => u.role === 'HOD' || u.role === 'FACULTY')
      .map((u) => ({ ...u }));
  },
};
