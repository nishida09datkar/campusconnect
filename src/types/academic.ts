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

export type Class = ClassRoom;

