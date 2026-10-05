import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { Course } from '@/types';

export const courseService = {
  async getAllCourses(): Promise<Course[]> {
    await delay(80, 150);
    return [...db.courses];
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    await delay(60, 120);
    const course = db.courses.find((c) => c.id === courseId);
    return course ? { ...course } : null;
  },

  async getCoursesByDepartment(departmentId: string): Promise<Course[]> {
    await delay(80, 150);
    return db.courses.filter((c) => c.departmentId === departmentId);
  },
};
