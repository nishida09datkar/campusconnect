export interface Department {
  id: string;
  name: string;
  code: string;
  hodId: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  year: number;
}

export interface ClassRoom {
  id: string;
  courseId: string;
  title: string;
  section: string;
  classCode: string;
  facultyId: string;
  studentIds: string[];
  coverColor: string;
}

export interface FacultyAllocation {
  id: string;
  facultyId: string;
  courseId: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
}

export interface DepartmentWithDetails extends Department {
  hodName?: string;
  hodEmail?: string;
  facultyCount?: number;
  studentCount?: number;
  courseCount?: number;
}

export interface FacultyAllocationWithDetails extends FacultyAllocation {
  facultyName?: string;
  facultyEmail?: string;
  facultyDesignation?: string;
  courseCode?: string;
  courseTitle?: string;
  courseYear?: number;
}

export type Class = ClassRoom;
