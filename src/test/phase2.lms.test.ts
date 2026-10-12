import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/api/mock/db';
import { classroomService } from '@/api/services/classroom.service';
import { assignmentService } from '@/api/services/assignment.service';
import { submissionService } from '@/api/services/submission.service';
import { attendanceService } from '@/api/services/attendance.service';
import { materialService } from '@/api/services/material.service';
import { courseService } from '@/api/services/course.service';

describe('Phase 2 — Classroom LMS End-to-End Workflows', () => {
  const facultyId = 'user-fac-neha'; // Prof. Neha Kulkarni
  const studentId = 'user-stu-1';   // Aryan Sharma
  const classId = 'class-1';        // Web Development (CE-A)

  beforeEach(() => {
    db.reset();
  });

  describe('1. Course & Class Management', () => {
    it('Faculty can list their classes with course and student counts', async () => {
      const classes = await classroomService.getFacultyClasses(facultyId);
      expect(classes.length).toBeGreaterThan(0);

      const webDevClass = classes.find((c) => c.id === classId);
      expect(webDevClass).toBeDefined();
      expect(webDevClass?.course?.code).toBe('CE301');
      expect(webDevClass?.title).toContain('Web Development');
      expect(webDevClass?.studentsCount).toBe(4);
    });

    it('Faculty can create a new class and immediately view and share it', async () => {
      const courses = await courseService.getAllCourses();
      expect(courses.length).toBeGreaterThan(0);

      const targetCourse = courses[0];
      const newClass = await classroomService.createClass(facultyId, {
        courseId: targetCourse.id,
        title: 'Cloud Computing & DevOps (CE-A)',
        section: 'A',
        coverColor: 'from-blue-600 to-cyan-600',
      });

      expect(newClass.id).toBeDefined();
      expect(newClass.classCode).toMatch(/^CC\d{4}$/);
      expect(newClass.title).toBe('Cloud Computing & DevOps (CE-A)');
      expect(newClass.studentsCount).toBe(0);

      // Verify it appears in faculty class list
      const updatedClasses = await classroomService.getFacultyClasses(facultyId);
      expect(updatedClasses.some((c) => c.id === newClass.id)).toBe(true);

      // Verify class can be retrieved by ID
      const fetched = await classroomService.getClassById(newClass.id);
      expect(fetched?.title).toBe('Cloud Computing & DevOps (CE-A)');
    });

    it('Student can join a class using a valid class code', async () => {
      // Create new class with no students
      const newClass = await classroomService.createClass(facultyId, {
        courseId: 'course-ce-301',
        title: 'Distributed Systems',
        section: 'B',
      });

      const studentClassesBefore = await classroomService.getStudentClasses(studentId);
      expect(studentClassesBefore.some((c) => c.id === newClass.id)).toBe(false);

      // Student joins with class code (test case-insensitivity)
      const joined = await classroomService.joinClassByCode(newClass.classCode.toLowerCase(), studentId);
      expect(joined.id).toBe(newClass.id);
      expect(joined.studentIds).toContain(studentId);

      // Verify it now appears in student classes
      const studentClassesAfter = await classroomService.getStudentClasses(studentId);
      expect(studentClassesAfter.some((c) => c.id === newClass.id)).toBe(true);

      // Test error if already enrolled
      await expect(
        classroomService.joinClassByCode(newClass.classCode, studentId)
      ).rejects.toThrow(/already enrolled/i);

      // Test error if code invalid
      await expect(
        classroomService.joinClassByCode('NONEXISTENT123', studentId)
      ).rejects.toThrow(/no classroom found/i);
    });
  });

  describe('2. Stream & Announcements', () => {
    it('Faculty creates announcement and student sees it with replies', async () => {
      // Faculty posts announcement
      const announcement = await classroomService.createStreamPost(classId, facultyId, {
        type: 'ANNOUNCEMENT',
        body: 'Midterm project schedule has been finalized. Presentations start Monday.',
        attachments: [
          {
            id: 'att-sch',
            name: 'Presentation_Schedule.pdf',
            sizeKb: 340,
            mime: 'application/pdf',
            url: '#',
          },
        ],
      });

      expect(announcement.id).toBeDefined();
      expect(announcement.body).toContain('Midterm project schedule');
      expect(announcement.attachments.length).toBe(1);

      // Student fetches stream for same class
      const stream = await classroomService.getClassStream(classId);
      const studentFoundPost = stream.find((p) => p.id === announcement.id);
      expect(studentFoundPost).toBeDefined();
      expect(studentFoundPost?.body).toContain('Midterm project schedule');
      expect(studentFoundPost?.attachments[0].name).toBe('Presentation_Schedule.pdf');

      // Student replies to the post
      const reply = await classroomService.addStreamReply(
        announcement.id,
        studentId,
        'Will the presentations be individual or group-based?'
      );
      expect(reply.body).toContain('individual or group-based');

      // Refresh stream and check reply
      const updatedStream = await classroomService.getClassStream(classId);
      const postWithReplies = updatedStream.find((p) => p.id === announcement.id);
      expect(postWithReplies?.replies.some((r) => r.id === reply.id)).toBe(true);
    });
  });

  describe('3. Course Materials', () => {
    it('Faculty uploads course material and student can view it', async () => {
      const material = await materialService.createMaterial(classId, facultyId, {
        title: 'Chapter 4: React Performance Optimization',
        description: 'useMemo, useCallback, and React Profiler deep-dive.',
        attachments: [
          {
            id: 'att-mat4',
            name: 'React_Performance.pdf',
            sizeKb: 1024,
            mime: 'application/pdf',
            url: '#',
          },
        ],
      });

      expect(material.id).toBeDefined();
      expect(material.title).toBe('Chapter 4: React Performance Optimization');

      // Student views materials for class
      const classMaterials = await materialService.getClassMaterials(classId);
      const found = classMaterials.find((m) => m.id === material.id);
      expect(found).toBeDefined();
      expect(found?.attachments[0].name).toBe('React_Performance.pdf');
    });
  });

  describe('4. Attendance Management', () => {
    it('Faculty marks attendance and student sees updated attendance record', async () => {
      const today = '2026-10-05';

      // Faculty marks attendance for class
      const savedRecord = await attendanceService.saveAttendance(classId, today, [
        { studentId: 'user-stu-1', status: 'PRESENT' },
        { studentId: 'user-stu-2', status: 'PRESENT' },
        { studentId: 'user-stu-3', status: 'LATE' },
        { studentId: 'user-stu-4', status: 'ABSENT' },
      ]);

      expect(savedRecord.date).toBe(today);
      expect(savedRecord.entries.length).toBe(4);

      // Student fetches their personal attendance summary
      const studentAttendance = await attendanceService.getStudentAttendance(classId, 'user-stu-1');
      expect(studentAttendance.totalSessions).toBeGreaterThan(0);
      expect(studentAttendance.presentCount).toBeGreaterThan(0);
      expect(studentAttendance.percentage).toBeGreaterThan(70);

      // Check session history includes today
      const todayHistory = studentAttendance.history.find((h) => h.date === today);
      expect(todayHistory).toBeDefined();
      expect(todayHistory?.status).toBe('PRESENT');

      // Check student 4 has ABSENT for today
      const absentStudentAttendance = await attendanceService.getStudentAttendance(classId, 'user-stu-4');
      const absentToday = absentStudentAttendance.history.find((h) => h.date === today);
      expect(absentToday?.status).toBe('ABSENT');
    });
  });

  describe('5. CRITICAL END-TO-END ASSIGNMENT WORKFLOW', () => {
    it('Faculty creates assignment -> Student submits -> Faculty grades -> Student sees grade & feedback', async () => {
      // Step 1: Faculty creates and publishes an assignment
      const newAssignment = await assignmentService.createAssignment(classId, {
        title: 'Lab 3: State Management & Redux Entity Adapter',
        instructions: 'Implement normalized slices with full test coverage and async thunks.',
        dueAt: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
        maxMarks: 50,
        status: 'PUBLISHED',
        attachments: [
          {
            id: 'att-lab3',
            name: 'Lab3_Spec.pdf',
            sizeKb: 500,
            mime: 'application/pdf',
            url: '#',
          },
        ],
      });

      expect(newAssignment.id).toBeDefined();
      expect(newAssignment.status).toBe('PUBLISHED');
      expect(newAssignment.maxMarks).toBe(50);

      // Step 2: Student checks classwork and sees the new assignment
      const studentAssignments = await assignmentService.getClassAssignments(classId, false);
      const foundInStudentList = studentAssignments.find((a) => a.id === newAssignment.id);
      expect(foundInStudentList).toBeDefined();
      expect(foundInStudentList?.title).toBe('Lab 3: State Management & Redux Entity Adapter');

      // Check student submission status before submitting
      const subBefore = await submissionService.getStudentSubmission(newAssignment.id, studentId);
      expect(subBefore).toBeNull();

      // Step 3: Student submits work
      const submittedWork = await submissionService.submitAssignment(newAssignment.id, studentId, {
        note: 'Completed all bonus unit tests and entity adapter normalization.',
        files: [
          {
            id: 'att-sol',
            name: 'Aryan_Lab3_Code.zip',
            sizeKb: 820,
            mime: 'application/zip',
            url: '#',
          },
        ],
      });

      expect(submittedWork.id).toBeDefined();
      expect(submittedWork.status).toBe('SUBMITTED');
      expect(submittedWork.files[0].name).toBe('Aryan_Lab3_Code.zip');
      expect(submittedWork.note).toContain('Completed all bonus unit tests');

      // Step 4: Faculty views submissions for the assignment
      const submissionsList = await submissionService.getSubmissionsByAssignment(newAssignment.id);
      expect(submissionsList.length).toBe(4); // 4 students in class-1

      const aryanSubmission = submissionsList.find((s) => s.studentId === studentId);
      expect(aryanSubmission).toBeDefined();
      expect(aryanSubmission?.status).toBe('SUBMITTED');
      expect(aryanSubmission?.files.length).toBe(1);
      expect(aryanSubmission?.files[0].name).toBe('Aryan_Lab3_Code.zip');

      // Step 5: Faculty grades the submission
      const graded = await submissionService.gradeSubmission(aryanSubmission!.id, {
        marks: 48,
        feedback: 'Outstanding architecture and clean tests! Perfect score on bonus items.',
      });

      expect(graded.status).toBe('GRADED');
      expect(graded.marks).toBe(48);
      expect(graded.feedback).toContain('Outstanding architecture');

      // Step 6: Student views their graded assignment
      const studentSubAfter = await submissionService.getStudentSubmission(newAssignment.id, studentId);
      expect(studentSubAfter?.status).toBe('GRADED');
      expect(studentSubAfter?.marks).toBe(48);
      expect(studentSubAfter?.feedback).toBe(
        'Outstanding architecture and clean tests! Perfect score on bonus items.'
      );

      // Step 7: Student views performance in My Grades tab
      const gradesOverview = await submissionService.getStudentGradesForClass(classId, studentId);
      const gradedItem = gradesOverview.items.find((i) => i.assignmentId === newAssignment.id);
      expect(gradedItem).toBeDefined();
      expect(gradedItem?.marks).toBe(48);
      expect(gradedItem?.maxMarks).toBe(50);
      expect(gradedItem?.status).toBe('GRADED');
      expect(gradedItem?.feedback).toContain('Outstanding architecture');

      // Step 8: Faculty views class grade matrix
      const classGradeMatrix = await submissionService.getClassGradeOverview(classId);
      const aryanInMatrix = classGradeMatrix.find((s) => s.studentId === studentId);
      expect(aryanInMatrix).toBeDefined();
      const lab3InMatrix = aryanInMatrix?.grades.find((g) => g.assignmentId === newAssignment.id);
      expect(lab3InMatrix?.marks).toBe(48);
      expect(lab3InMatrix?.status).toBe('GRADED');
    });

    it('Validates grading bounds (marks >= 0 and marks <= maxMarks)', async () => {
      const assignment = await assignmentService.createAssignment(classId, {
        title: 'Quiz Assignment',
        instructions: 'Test',
        dueAt: new Date().toISOString(),
        maxMarks: 20,
      });

      const sub = await submissionService.submitAssignment(assignment.id, studentId, {
        files: [{ id: '1', name: 'f.txt', sizeKb: 1, mime: 'text/plain', url: '#' }],
      });

      // Marks exceeding maximum
      await expect(
        submissionService.gradeSubmission(sub.id, { marks: 25, feedback: 'Too high' })
      ).rejects.toThrow(/cannot exceed/i);

      // Negative marks
      await expect(
        submissionService.gradeSubmission(sub.id, { marks: -5, feedback: 'Negative' })
      ).rejects.toThrow(/greater than or equal to 0/i);
    });

    it('Rejects a resubmission once the work has been graded, keeping the grade', async () => {
      const assignment = await assignmentService.createAssignment(classId, {
        title: 'Graded Lab',
        instructions: 'Test',
        dueAt: new Date(Date.now() + 86_400_000).toISOString(),
        maxMarks: 20,
      });
      const file = { id: '1', name: 'f.txt', sizeKb: 1, mime: 'text/plain', url: '#' };

      const sub = await submissionService.submitAssignment(assignment.id, studentId, { files: [file] });
      await submissionService.gradeSubmission(sub.id, { marks: 18, feedback: 'Well done' });

      await expect(
        submissionService.submitAssignment(assignment.id, studentId, { files: [file] })
      ).rejects.toThrow(/already been graded/i);

      const after = await submissionService.getStudentSubmission(assignment.id, studentId);
      expect(after?.status).toBe('GRADED');
      expect(after?.marks).toBe(18);
    });

    it('Rejects a submission to an assignment that is still a draft', async () => {
      const draft = await assignmentService.createAssignment(classId, {
        title: 'Unpublished Lab',
        instructions: 'Test',
        dueAt: new Date(Date.now() + 86_400_000).toISOString(),
        maxMarks: 20,
        status: 'DRAFT',
      });

      await expect(
        submissionService.submitAssignment(draft.id, studentId, {
          files: [{ id: '1', name: 'f.txt', sizeKb: 1, mime: 'text/plain', url: '#' }],
        })
      ).rejects.toThrow(/not open for submissions/i);

      expect(await submissionService.getStudentSubmission(draft.id, studentId)).toBeNull();
    });
  });

  describe('6. People Rosters', () => {
    it('Faculty and student see class members and instructor', async () => {
      const members = await classroomService.getClassMembers(classId);
      expect(members.faculty).toBeDefined();
      expect(members.faculty?.id).toBe(facultyId);
      expect(members.students.length).toBe(4);
      expect(members.students.some((s) => s.id === studentId)).toBe(true);
    });
  });
});
