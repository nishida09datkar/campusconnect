import { apiClient } from '../axios';
import { USE_MOCKS } from '../config';
import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { Course } from '@/types';

export const courseService = {
  async getAllCourses(): Promise<Course[]> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<Course[]>('/api/courses');
      return res.data;
    }

    await delay(80, 150);
    return [...db.courses];
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    if (!USE_MOCKS) {
      try {
        const res = await apiClient.get<Course>(`/api/courses/${courseId}`);
        return res.data;
      } catch (err: any) {
        if (err.status === 404) return null;
        throw err;
      }
    }

    await delay(60, 120);
    const course = db.courses.find((c) => c.id === courseId);
    return course ? { ...course } : null;
  },

  async getCoursesByDepartment(departmentId: string): Promise<Course[]> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<Course[]>('/api/courses', {
        params: { departmentId },
      });
      return res.data;
    }

    await delay(80, 150);
    return db.courses.filter((c) => c.departmentId === departmentId);
  },
};
