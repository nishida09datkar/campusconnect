import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { Submission, SubmissionStatus, User, Attachment, GradeOverview, StudentGradeItem } from '@/types';

export interface EnrichedSubmission extends Partial<Submission> {
  id: string;
  assignmentId: string;
  studentId: string;
  student: User;
  status: SubmissionStatus;
  files: Attachment[];
  note?: string;
  submittedAt?: string;
  marks?: number;
  feedback?: string;
}

export const submissionService = {
  async getSubmissionsByAssignment(assignmentId: string): Promise<EnrichedSubmission[]> {
    await delay(120, 250);
    const assignment = db.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    const cls = db.classes.find((c) => c.id === assignment.classId);
    const enrolledStudents = db.users.filter((u) => cls?.studentIds.includes(u.id));

    return enrolledStudents.map((student) => {
      const existing = db.submissions.find(
        (s) => s.assignmentId === assignmentId && s.studentId === student.id
      );

      if (existing) {
        return {
          ...existing,
          student,
        };
      }

      // Synthetic pending record for enrolled student
      return {
        id: `pending::${student.id}::${assignmentId}`,
        assignmentId,
        studentId: student.id,
        student,
        status: 'PENDING' as SubmissionStatus,
        files: [],
      };
    });
  },

  async getStudentSubmission(assignmentId: string, studentId: string): Promise<Submission | null> {
    await delay(80, 160);
    const sub = db.submissions.find(
      (s) => s.assignmentId === assignmentId && s.studentId === studentId
    );
    return sub ? { ...sub } : null;
  },

  async submitAssignment(
    assignmentId: string,
    studentId: string,
    data: { note?: string; files: Attachment[] }
  ): Promise<Submission> {
    await delay(250, 450);

    const assignment = db.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment with ID ${assignmentId} not found`);
    }
    if (assignment.status === 'DRAFT') {
      throw new Error('This assignment is not open for submissions yet.');
    }

    const now = new Date();
    const isLate = now.getTime() > new Date(assignment.dueAt).getTime();
    const status: SubmissionStatus = isLate ? 'LATE' : 'SUBMITTED';

    const existingIndex = db.submissions.findIndex(
      (s) => s.assignmentId === assignmentId && s.studentId === studentId
    );

    let submission: Submission;

    if (existingIndex !== -1) {
      // A grade belongs to the work it was given for, so graded work can no longer be replaced
      if (db.submissions[existingIndex].status === 'GRADED') {
        throw new Error('This assignment has already been graded and can no longer be resubmitted.');
      }
      submission = {
        ...db.submissions[existingIndex],
        files: data.files,
        note: data.note?.trim(),
        submittedAt: now.toISOString(),
        status,
      };
      db.submissions[existingIndex] = submission;
    } else {
      submission = {
        id: `sub-${Date.now()}`,
        assignmentId,
        studentId,
        files: data.files,
        note: data.note?.trim(),
        submittedAt: now.toISOString(),
        status,
      };
      db.submissions.unshift(submission);
    }

    // Notify faculty instructor
    const cls = db.classes.find((c) => c.id === assignment.classId);
    if (cls?.facultyId) {
      const student = db.users.find((u) => u.id === studentId);
      db.notifications.unshift({
        id: `notif-${Date.now()}-${cls.facultyId}`,
        userId: cls.facultyId,
        type: 'ASSIGNMENT',
        title: 'New Student Submission',
        body: `${student?.name || 'A student'} submitted "${assignment.title}".`,
        link: `/faculty/assignments/${assignment.id}/submissions`,
        read: false,
        createdAt: now.toISOString(),
      });
    }

    return { ...submission };
  },

  async gradeSubmission(
    submissionId: string,
    data: { marks: number; feedback?: string }
  ): Promise<Submission> {
    await delay(200, 380);

    // Look for submission in db.submissions
    let submission = db.submissions.find((s) => s.id === submissionId);

    // If grading a pending item that hasn't created a record yet:
    if (!submission && submissionId.startsWith('pending::')) {
      const parts = submissionId.split('::');
      const studentId = parts[1];
      const assignmentId = parts[2];
      submission = {
        id: `sub-${Date.now()}`,
        assignmentId,
        studentId,
        files: [],
        status: 'GRADED',
        marks: Number(data.marks),
        feedback: data.feedback?.trim(),
      };
      db.submissions.unshift(submission);
    } else if (!submission && submissionId.startsWith('pending-')) {
      const remaining = submissionId.replace('pending-', '');
      const matchingStudent = db.users.find((u) => remaining.startsWith(u.id));
      if (matchingStudent) {
        const studentId = matchingStudent.id;
        const assignmentId = remaining.slice(studentId.length + 1);
        submission = {
          id: `sub-${Date.now()}`,
          assignmentId,
          studentId,
          files: [],
          status: 'GRADED',
          marks: Number(data.marks),
          feedback: data.feedback?.trim(),
        };
        db.submissions.unshift(submission);
      }
    }

    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    const assignment = db.assignments.find((a) => a.id === submission.assignmentId);
    if (!assignment) {
      throw new Error(`Associated assignment ${submission.assignmentId} not found`);
    }

    const marks = Number(data.marks);
    if (isNaN(marks) || marks < 0) {
      throw new Error('Marks must be greater than or equal to 0.');
    }
    if (marks > assignment.maxMarks) {
      throw new Error(`Marks cannot exceed the maximum of ${assignment.maxMarks}.`);
    }

    submission.status = 'GRADED';
    submission.marks = marks;
    submission.feedback = data.feedback?.trim() || undefined;

    // Notify the student
    db.notifications.unshift({
      id: `notif-${Date.now()}-${submission.studentId}`,
      userId: submission.studentId,
      type: 'GRADE',
      title: 'Assignment Graded',
      body: `Your submission for "${assignment.title}" received ${marks}/${assignment.maxMarks} marks.`,
      link: `/student/assignments/${assignment.id}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return { ...submission };
  },

  async getStudentGradesForClass(
    classId: string,
    studentId: string
  ): Promise<{
    items: (StudentGradeItem & { feedback?: string })[];
    totalMarksEarned: number;
    totalPossibleMarks: number;
    percentage: number;
  }> {
    await delay(120, 220);

    const assignments = db.assignments.filter(
      (a) => a.classId === classId && a.status !== 'DRAFT'
    );

    let totalEarned = 0;
    let totalPossible = 0;

    const items = assignments.map((a) => {
      const sub = db.submissions.find(
        (s) => s.assignmentId === a.id && s.studentId === studentId
      );

      const isGraded = sub?.status === 'GRADED';
      if (isGraded && typeof sub?.marks === 'number') {
        totalEarned += sub.marks;
        totalPossible += a.maxMarks;
      } else {
        totalPossible += a.maxMarks;
      }

      return {
        assignmentId: a.id,
        assignmentTitle: a.title,
        maxMarks: a.maxMarks,
        marks: sub?.marks,
        status: (sub?.status || 'PENDING') as SubmissionStatus,
        submittedAt: sub?.submittedAt,
        feedback: sub?.feedback,
      };
    });

    const percentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    return {
      items,
      totalMarksEarned: totalEarned,
      totalPossibleMarks: totalPossible,
      percentage,
    };
  },

  async getClassGradeOverview(classId: string): Promise<GradeOverview[]> {
    await delay(150, 300);

    const cls = db.classes.find((c) => c.id === classId);
    if (!cls) return [];

    const assignments = db.assignments.filter((a) => a.classId === classId && a.status !== 'DRAFT');
    const students = db.users.filter((u) => cls.studentIds.includes(u.id));

    return students.map((student) => {
      let totalEarned = 0;
      let totalPossible = 0;

      const grades: StudentGradeItem[] = assignments.map((a) => {
        const sub = db.submissions.find(
          (s) => s.assignmentId === a.id && s.studentId === student.id
        );

        if (sub?.status === 'GRADED' && typeof sub.marks === 'number') {
          totalEarned += sub.marks;
        }
        totalPossible += a.maxMarks;

        return {
          assignmentId: a.id,
          assignmentTitle: a.title,
          maxMarks: a.maxMarks,
          marks: sub?.marks,
          status: (sub?.status || 'PENDING') as SubmissionStatus,
          submittedAt: sub?.submittedAt,
        };
      });

      const percentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        grades,
        totalMarksEarned: totalEarned,
        totalPossibleMarks: totalPossible,
        percentage,
      };
    });
  },
};
