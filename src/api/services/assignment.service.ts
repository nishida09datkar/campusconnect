import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { Assignment, Attachment, SubmissionStatus } from '@/types';

export interface EnrichedAssignment extends Assignment {
  classTitle?: string;
  courseCode?: string;
  submissionsCount?: number;
  totalStudents?: number;
  submissionStatus?: SubmissionStatus;
  marks?: number;
}

export const assignmentService = {
  async getClassAssignments(classId: string, isFaculty: boolean = false): Promise<Assignment[]> {
    await delay(100, 220);
    return db.assignments
      .filter((a) => a.classId === classId && (isFaculty || a.status !== 'DRAFT'))
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  },

  async getAssignmentById(id: string): Promise<Assignment | null> {
    await delay(60, 150);
    const assignment = db.assignments.find((a) => a.id === id);
    return assignment ? { ...assignment } : null;
  },

  async createAssignment(
    classId: string,
    data: {
      title: string;
      instructions: string;
      dueAt: string;
      maxMarks: number;
      attachments?: Attachment[];
      status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
    }
  ): Promise<Assignment> {
    await delay(200, 350);

    const newAssignment: Assignment = {
      id: `assign-${Date.now()}`,
      classId,
      title: data.title.trim(),
      instructions: data.instructions.trim(),
      dueAt: data.dueAt,
      maxMarks: Number(data.maxMarks),
      attachments: data.attachments || [],
      status: data.status || 'PUBLISHED',
    };

    db.assignments.unshift(newAssignment);

    // If published, notify enrolled students
    if (newAssignment.status === 'PUBLISHED') {
      const cls = db.classes.find((c) => c.id === classId);
      if (cls) {
        for (const studentId of cls.studentIds) {
          db.notifications.unshift({
            id: `notif-${Date.now()}-${studentId}`,
            userId: studentId,
            type: 'ASSIGNMENT',
            title: 'New Assignment Posted',
            body: `Assignment "${newAssignment.title}" has been assigned.`,
            link: `/student/assignments/${newAssignment.id}`,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return { ...newAssignment };
  },

  async updateAssignment(id: string, data: Partial<Assignment>): Promise<Assignment> {
    await delay(150, 300);
    const index = db.assignments.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Assignment with ID ${id} not found`);
    }

    const updated = {
      ...db.assignments[index],
      ...data,
      maxMarks: data.maxMarks !== undefined ? Number(data.maxMarks) : db.assignments[index].maxMarks,
    };

    db.assignments[index] = updated;
    return { ...updated };
  },

  async deleteAssignment(id: string): Promise<boolean> {
    await delay(120, 250);
    const index = db.assignments.findIndex((a) => a.id === id);
    if (index !== -1) {
      db.assignments.splice(index, 1);
      // Clean up submissions for this assignment
      db.submissions = db.submissions.filter((s) => s.assignmentId !== id);
      return true;
    }
    return false;
  },

  async getFacultyAssignments(facultyId: string): Promise<EnrichedAssignment[]> {
    await delay(150, 280);
    const facultyClasses = db.classes.filter((c) => c.facultyId === facultyId);
    const classIds = facultyClasses.map((c) => c.id);

    const assignments = db.assignments.filter((a) => classIds.includes(a.classId));

    return assignments.map((a) => {
      const cls = facultyClasses.find((c) => c.id === a.classId);
      const course = cls ? db.courses.find((course) => course.id === cls.courseId) : undefined;
      const submissions = db.submissions.filter((s) => s.assignmentId === a.id);

      return {
        ...a,
        classTitle: cls?.title,
        courseCode: course?.code,
        submissionsCount: submissions.filter((s) => s.status !== 'PENDING').length,
        totalStudents: cls?.studentIds.length || 0,
      };
    });
  },

  async getStudentAssignments(studentId: string): Promise<EnrichedAssignment[]> {
    await delay(150, 280);
    const studentClasses = db.classes.filter((c) => c.studentIds.includes(studentId));
    const classIds = studentClasses.map((c) => c.id);

    const assignments = db.assignments.filter(
      (a) => classIds.includes(a.classId) && a.status !== 'DRAFT'
    );

    return assignments.map((a) => {
      const cls = studentClasses.find((c) => c.id === a.classId);
      const course = cls ? db.courses.find((course) => course.id === cls.courseId) : undefined;
      const sub = db.submissions.find((s) => s.assignmentId === a.id && s.studentId === studentId);

      return {
        ...a,
        classTitle: cls?.title,
        courseCode: course?.code,
        submissionStatus: sub?.status || 'PENDING',
        marks: sub?.marks,
      };
    });
  },
};
