import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { FacultyAllocation, FacultyAllocationWithDetails } from '@/types';

export const allocationService = {
  async getAllocations(): Promise<FacultyAllocationWithDetails[]> {
    await delay(70, 150);
    return db.allocations.map((alloc) => enrichAllocation(alloc));
  },

  async getAllocationsByDepartment(departmentId: string): Promise<FacultyAllocationWithDetails[]> {
    await delay(80, 160);
    // Find all courses belonging to this department
    const deptCourseIds = new Set(
      db.courses.filter((c) => c.departmentId === departmentId).map((c) => c.id)
    );

    return db.allocations
      .filter((alloc) => deptCourseIds.has(alloc.courseId))
      .map((alloc) => enrichAllocation(alloc));
  },

  async createAllocation(
    facultyId: string,
    courseId: string,
    hodDepartmentId?: string
  ): Promise<FacultyAllocationWithDetails> {
    await delay(120, 240);

    const faculty = db.users.find((u) => u.id === facultyId);
    if (!faculty) {
      throw { status: 404, message: 'Faculty member not found' };
    }
    if (faculty.role !== 'FACULTY') {
      throw { status: 400, message: 'Only faculty members can be allocated to courses' };
    }

    const course = db.courses.find((c) => c.id === courseId);
    if (!course) {
      throw { status: 404, message: 'Course not found' };
    }

    // Department boundary enforcement:
    // If hodDepartmentId is provided, course and faculty must match that department!
    if (hodDepartmentId) {
      if (course.departmentId !== hodDepartmentId) {
        throw { status: 403, message: 'Cannot allocate courses outside your department' };
      }
      if (faculty.departmentId !== hodDepartmentId) {
        throw { status: 403, message: 'Cannot allocate faculty outside your department' };
      }
    }

    // Check if allocation already exists
    const existing = db.allocations.find(
      (a) => a.facultyId === facultyId && a.courseId === courseId
    );
    if (existing) {
      throw { status: 400, message: 'This faculty member is already allocated to this course' };
    }

    const newAlloc: FacultyAllocation = {
      id: `alloc-${Date.now().toString().slice(-6)}`,
      facultyId,
      courseId,
    };

    db.allocations.push(newAlloc);
    return enrichAllocation(newAlloc);
  },

  async deleteAllocation(allocationId: string): Promise<{ success: boolean }> {
    await delay(100, 200);
    const index = db.allocations.findIndex((a) => a.id === allocationId);
    if (index === -1) {
      throw { status: 404, message: 'Allocation not found' };
    }

    db.allocations.splice(index, 1);
    return { success: true };
  },
};

function enrichAllocation(alloc: FacultyAllocation): FacultyAllocationWithDetails {
  const faculty = db.users.find((u) => u.id === alloc.facultyId);
  const course = db.courses.find((c) => c.id === alloc.courseId);

  return {
    ...alloc,
    facultyName: faculty?.name || 'Unknown Faculty',
    facultyEmail: faculty?.email,
    facultyDesignation: faculty?.designation,
    courseCode: course?.code || 'N/A',
    courseTitle: course?.title || 'Unknown Course',
    courseYear: course?.year,
  };
}
