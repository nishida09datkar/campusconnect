import { apiClient } from '../axios';
import { USE_MOCKS } from '../config';
import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { Department, DepartmentWithDetails } from '@/types';

export const departmentService = {
  async getAllDepartments(): Promise<Department[]> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<Department[]>('/api/departments');
      return res.data;
    }

    await delay(60, 140);
    return [...db.departments];
  },

  async getDepartmentsWithDetails(): Promise<DepartmentWithDetails[]> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<DepartmentWithDetails[]>('/api/departments');
      return res.data;
    }

    await delay(80, 160);
    return db.departments.map((dept) => {
      const hod = db.users.find((u) => u.id === dept.hodId);
      const facultyCount = db.users.filter(
        (u) => u.departmentId === dept.id && u.role === 'FACULTY'
      ).length;
      const studentCount = db.users.filter(
        (u) => u.departmentId === dept.id && u.role === 'STUDENT'
      ).length;
      const courseCount = db.courses.filter((c) => c.departmentId === dept.id).length;

      return {
        ...dept,
        hodName: hod ? hod.name : 'Unassigned',
        hodEmail: hod ? hod.email : undefined,
        facultyCount,
        studentCount,
        courseCount,
      };
    });
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    if (!USE_MOCKS) {
      try {
        const res = await apiClient.get<Department>(`/api/departments/${id}`);
        return res.data;
      } catch (err: any) {
        if (err.status === 404) return null;
        throw err;
      }
    }

    await delay(50, 100);
    const dept = db.departments.find((d) => d.id === id);
    return dept ? { ...dept } : null;
  },

  async createDepartment(data: { name: string; code: string; hodId: string }): Promise<Department> {
    if (!USE_MOCKS) {
      const res = await apiClient.post<Department>('/api/departments', data);
      return res.data;
    }

    await delay(120, 250);
    const code = data.code.trim().toUpperCase();
    const existing = db.departments.find(
      (d) => d.code.toUpperCase() === code || d.name.toLowerCase() === data.name.trim().toLowerCase()
    );
    if (existing) {
      throw {
        status: 400,
        message: `Department with code '${code}' or name '${data.name}' already exists.`,
      };
    }

    const newDept: Department = {
      id: `dept-${code.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      name: data.name.trim(),
      code,
      hodId: data.hodId,
    };

    db.departments.push(newDept);

    // If a HOD was specified, ensure that user's departmentId is updated
    if (data.hodId) {
      const hodUser = db.users.find((u) => u.id === data.hodId);
      if (hodUser) {
        hodUser.departmentId = newDept.id;
      }
    }

    return { ...newDept };
  },

  async updateDepartment(
    id: string,
    data: Partial<Pick<Department, 'name' | 'code' | 'hodId'>>
  ): Promise<Department> {
    if (!USE_MOCKS) {
      const res = await apiClient.put<Department>(`/api/departments/${id}`, data);
      return res.data;
    }

    await delay(120, 220);
    const index = db.departments.findIndex((d) => d.id === id);
    if (index === -1) {
      throw { status: 404, message: 'Department not found' };
    }

    if (data.code) {
      const code = data.code.trim().toUpperCase();
      const duplicate = db.departments.find(
        (d) => d.id !== id && d.code.toUpperCase() === code
      );
      if (duplicate) {
        throw { status: 400, message: `Department code '${code}' is already used.` };
      }
      db.departments[index].code = code;
    }

    if (data.name) {
      db.departments[index].name = data.name.trim();
    }

    if (data.hodId !== undefined) {
      db.departments[index].hodId = data.hodId;
      const hodUser = db.users.find((u) => u.id === data.hodId);
      if (hodUser) {
        hodUser.departmentId = id;
      }
    }

    return { ...db.departments[index] };
  },

  async deleteDepartment(id: string): Promise<{ success: boolean; message?: string }> {
    if (!USE_MOCKS) {
      const res = await apiClient.delete<{ success: boolean; message?: string }>(`/api/departments/${id}`);
      return res.data;
    }

    await delay(120, 220);
    const index = db.departments.findIndex((d) => d.id === id);
    if (index === -1) {
      throw { status: 404, message: 'Department not found' };
    }

    // Check if courses or users belong to department
    const courseCount = db.courses.filter((c) => c.departmentId === id).length;
    const userCount = db.users.filter((u) => u.departmentId === id).length;

    // Remove department
    db.departments.splice(index, 1);

    return {
      success: true,
      message: `Department removed successfully. (${courseCount} courses, ${userCount} associated users)`,
    };
  },
};
