import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/api/mock/db';
import { departmentService } from '@/api/services/department.service';
import { userService } from '@/api/services/user.service';
import { allocationService } from '@/api/services/allocation.service';
import { noticeService } from '@/api/services/notice.service';
import { notificationService } from '@/api/services/notification.service';
import { calendarService } from '@/api/services/calendar.service';
import { assignmentService } from '@/api/services/assignment.service';
import { sanitizeHtml } from '@/utils/sanitize';
import { canInteract, hasRole } from '@/utils/permissions';
import { User } from '@/types';

describe('Phase 3 — Department Layer & Notifications Specification Tests', () => {
  beforeEach(() => {
    db.reset();
  });

  /* ===================================================================
   * A. ADMIN: DEPARTMENTS CRUD
   * =================================================================== */
  describe('A. Departments Management (Admin)', () => {
    it('Admin can list departments with detailed metrics', async () => {
      const depts = await departmentService.getDepartmentsWithDetails();
      expect(depts.length).toBeGreaterThanOrEqual(2);

      const ceDept = depts.find((d) => d.code === 'CE');
      expect(ceDept).toBeDefined();
      expect(ceDept?.name).toBe('Computer Engineering');
      expect(ceDept?.hodName).toBe('Dr. Kavita Rao');
      expect(ceDept?.facultyCount).toBeGreaterThan(0);
      expect(ceDept?.studentCount).toBeGreaterThan(0);
      expect(ceDept?.courseCount).toBeGreaterThan(0);
    });

    it('Admin can create a new department', async () => {
      const newDept = await departmentService.createDepartment({
        name: 'Mechanical Engineering',
        code: 'ME',
        hodId: 'user-hod-ce',
      });

      expect(newDept.id).toBeDefined();
      expect(newDept.code).toBe('ME');
      expect(newDept.name).toBe('Mechanical Engineering');

      const all = await departmentService.getAllDepartments();
      expect(all.some((d) => d.code === 'ME')).toBe(true);
    });

    it('Rejects duplicate department code creation', async () => {
      await expect(
        departmentService.createDepartment({
          name: 'Computer Eng Duplicate',
          code: 'CE',
          hodId: 'user-hod-ce',
        })
      ).rejects.toEqual(
        expect.objectContaining({
          status: 400,
        })
      );
    });

    it('Admin can update an existing department', async () => {
      const updated = await departmentService.updateDepartment('dept-ce', {
        name: 'School of Computer Science & Engineering',
        code: 'CSE',
      });

      expect(updated.name).toBe('School of Computer Science & Engineering');
      expect(updated.code).toBe('CSE');

      const fetched = await departmentService.getDepartmentById('dept-ce');
      expect(fetched?.code).toBe('CSE');
    });

    it('Admin can delete a department', async () => {
      // First create a temporary department
      const tempDept = await departmentService.createDepartment({
        name: 'Civil Engineering',
        code: 'CIVIL',
        hodId: '',
      });

      const res = await departmentService.deleteDepartment(tempDept.id);
      expect(res.success).toBe(true);

      const fetched = await departmentService.getDepartmentById(tempDept.id);
      expect(fetched).toBeNull();
    });

    it('Role permissions: Only ADMIN has permission to manage departments', () => {
      const admin: Partial<User> = { role: 'ADMIN' };
      const hod: Partial<User> = { role: 'HOD' };
      const faculty: Partial<User> = { role: 'FACULTY' };
      const student: Partial<User> = { role: 'STUDENT' };

      expect(hasRole(admin as User, ['ADMIN'])).toBe(true);
      expect(hasRole(hod as User, ['ADMIN'])).toBe(false);
      expect(hasRole(faculty as User, ['ADMIN'])).toBe(false);
      expect(hasRole(student as User, ['ADMIN'])).toBe(false);
    });
  });

  /* ===================================================================
   * B. ADMIN: USERS DIRECTORY
   * =================================================================== */
  describe('B. Users Management (Admin)', () => {
    it('Admin can load users list with role & department filters and pagination', async () => {
      const result = await userService.getUsers({
        role: 'FACULTY',
        departmentId: 'dept-ce',
        page: 1,
        pageSize: 10,
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every((u) => u.role === 'FACULTY')).toBe(true);
      expect(result.items.every((u) => u.departmentId === 'dept-ce')).toBe(true);
      expect(result.total).toBe(result.items.length);
    });

    it('Admin can create a new student user with roll and year details', async () => {
      const newUser = await userService.createUser({
        name: 'Devan Shah',
        email: 'devan@campus.test',
        role: 'STUDENT',
        departmentId: 'dept-ce',
        isActive: true,
        rollNo: 'CE399',
        year: 3,
        division: 'A',
      });

      expect(newUser.id).toBeDefined();
      expect(newUser.email).toBe('devan@campus.test');
      expect(newUser.rollNo).toBe('CE399');

      const fetched = await userService.getUserById(newUser.id);
      expect(fetched).toBeDefined();
      expect(fetched?.name).toBe('Devan Shah');
    });

    it('Admin can toggle user active / inactive status', async () => {
      const student = db.users.find((u) => u.id === 'user-stu-1')!;
      expect(student.isActive).toBe(true);

      const deactivated = await userService.toggleUserStatus(student.id, false);
      expect(deactivated.isActive).toBe(false);

      const reactivated = await userService.toggleUserStatus(student.id, true);
      expect(reactivated.isActive).toBe(true);
    });
  });

  /* ===================================================================
   * C. HOD: FACULTY / COURSE ALLOCATION
   * =================================================================== */
  describe('C. Faculty & Course Allocation (HOD)', () => {
    it('HOD can view relevant allocations for their department', async () => {
      const allocs = await allocationService.getAllocationsByDepartment('dept-ce');
      expect(allocs.length).toBeGreaterThan(0);

      // Verify enriched properties
      const first = allocs[0];
      expect(first.facultyName).toBeDefined();
      expect(first.courseCode).toBeDefined();
      expect(first.courseTitle).toBeDefined();
    });

    it('HOD can allocate a faculty member to a department course', async () => {
      // Allocate Prof. Anita Patil to CE301
      const newAlloc = await allocationService.createAllocation(
        'user-fac-anita',
        'course-ce-301',
        'dept-ce'
      );

      expect(newAlloc.id).toBeDefined();
      expect(newAlloc.facultyName).toBe('Prof. Anita Patil');
      expect(newAlloc.courseCode).toBe('CE301');

      // Verify it appears in department allocations
      const updated = await allocationService.getAllocationsByDepartment('dept-ce');
      expect(updated.some((a) => a.id === newAlloc.id)).toBe(true);
    });

    it('HOD cannot allocate a faculty member from another department', async () => {
      // Prof. Vivek Shah is in IT dept; trying to allocate under CE dept
      await expect(
        allocationService.createAllocation(
          'user-fac-vivek',
          'course-ce-301',
          'dept-ce'
        )
      ).rejects.toEqual(
        expect.objectContaining({
          status: 403,
        })
      );
    });

    it('HOD can remove a faculty allocation', async () => {
      const existing = db.allocations[0];
      const res = await allocationService.deleteAllocation(existing.id);
      expect(res.success).toBe(true);

      const remaining = db.allocations.find((a) => a.id === existing.id);
      expect(remaining).toBeUndefined();
    });
  });

  /* ===================================================================
   * D. NOTICES & RICH TEXT SANITIZATION (DOMPurify)
   * =================================================================== */
  describe('D. Notices & DOMPurify Sanitization', () => {
    it('Sanitizes malicious script tags and event handlers from rich text body', () => {
      const dirtyHtml = '<p>Normal text</p><script>alert("XSS Attack!")</script><img src="x" onerror="alert(1)">';
      const cleanHtml = sanitizeHtml(dirtyHtml);

      expect(cleanHtml).not.toContain('<script>');
      expect(cleanHtml).not.toContain('alert');
      expect(cleanHtml).not.toContain('onerror');
      expect(cleanHtml).toContain('<p>Normal text</p>');
    });

    it('Preserves valid formatting tags (b, i, h3, ul, li)', () => {
      const richHtml = '<b>Important Notice:</b><h3>Final Exam</h3><ul><li>Item 1</li></ul>';
      const cleanHtml = sanitizeHtml(richHtml);

      expect(cleanHtml).toContain('<b>Important Notice:</b>');
      expect(cleanHtml).toContain('<h3>Final Exam</h3>');
      expect(cleanHtml).toContain('<ul><li>Item 1</li></ul>');
    });

    it('Notice creation stores sanitized body and appears in notice history', async () => {
      const notice = await noticeService.createNotice({
        senderId: 'user-hod-ce',
        departmentId: 'dept-ce',
        audience: 'ALL',
        title: 'Midterm Evaluation Schedule',
        body: '<p>Evaluation will commence next Monday.</p><script>evil()</script>',
      });

      expect(notice.id).toBeDefined();
      expect(notice.body).not.toContain('<script>');
      expect(notice.body).toContain('<p>Evaluation will commence next Monday.</p>');

      const history = await noticeService.getNotices({ departmentId: 'dept-ce' });
      expect(history.some((n) => n.id === notice.id)).toBe(true);
    });
  });

  /* ===================================================================
   * E. CRITICAL ACCEPTANCE TEST: NOTICE AUDIENCE TARGETING & NOTIFICATIONS
   * =================================================================== */
  describe('E. CRITICAL ACCEPTANCE TEST — Audience Targeted Notifications', () => {
    it('CRITICAL ACCEPTANCE TEST: Notice targeted ONLY to students sends notification to student and NOT to faculty', async () => {
      const studentId = 'user-stu-1'; // Aryan Sharma (CE Year 3)
      const facultyId = 'user-fac-neha'; // Prof. Neha Kulkarni (CE Faculty)

      // Get initial unread counts
      const studentInitialUnread = await notificationService.getUnreadCount(studentId);
      const facultyInitialUnread = await notificationService.getUnreadCount(facultyId);

      // HOD sends notice targeted ONLY to STUDENTS in CE department
      await noticeService.createNotice({
        senderId: 'user-hod-ce',
        departmentId: 'dept-ce',
        audience: 'STUDENTS',
        title: 'Urgent Lab Submission Guidelines',
        body: '<p>All students must format their lab notebooks per university standards.</p>',
      });

      // 1. Verify intended STUDENT receives notification
      const studentNotifs = await notificationService.getUserNotifications(studentId);
      const studentReceivedNotice = studentNotifs.some(
        (n) => n.type === 'NOTICE' && n.title === 'Urgent Lab Submission Guidelines'
      );
      expect(studentReceivedNotice).toBe(true);

      const studentNewUnread = await notificationService.getUnreadCount(studentId);
      expect(studentNewUnread).toBe(studentInitialUnread + 1);

      // 2. Verify FACULTY member does NOT receive the student-only notice
      const facultyNotifs = await notificationService.getUserNotifications(facultyId);
      const facultyReceivedNotice = facultyNotifs.some(
        (n) => n.type === 'NOTICE' && n.title === 'Urgent Lab Submission Guidelines'
      );
      expect(facultyReceivedNotice).toBe(false);

      const facultyNewUnread = await notificationService.getUnreadCount(facultyId);
      expect(facultyNewUnread).toBe(facultyInitialUnread);
    });

    it('Notice targeted ONLY to FACULTY sends notification to faculty and NOT to students', async () => {
      const studentId = 'user-stu-1';
      const facultyId = 'user-fac-neha';

      await noticeService.createNotice({
        senderId: 'user-hod-ce',
        departmentId: 'dept-ce',
        audience: 'FACULTY',
        title: 'Confidential Syllabus Audit Meeting',
        body: '<p>Faculty members are requested to attend the syllabus audit.</p>',
      });

      // Faculty receives
      const facultyNotifs = await notificationService.getUserNotifications(facultyId);
      expect(
        facultyNotifs.some((n) => n.title === 'Confidential Syllabus Audit Meeting')
      ).toBe(true);

      // Student does NOT receive
      const studentNotifs = await notificationService.getUserNotifications(studentId);
      expect(
        studentNotifs.some((n) => n.title === 'Confidential Syllabus Audit Meeting')
      ).toBe(false);
    });

    it('Notice targeted to specific YEAR only notifies students of that year', async () => {
      const year3Student = 'user-stu-1'; // CE Year 3
      const year2Student = 'user-stu-11'; // IT Year 2 (or test student with different year)

      // Send notice for Year 3 only (institute-wide or CE)
      await noticeService.createNotice({
        senderId: 'user-hod-ce',
        departmentId: 'dept-ce',
        audience: 'STUDENTS',
        year: 3,
        title: 'Year 3 Internship Drive',
        body: '<p>Registration open for 3rd year students.</p>',
      });

      // Year 3 student receives
      const stu1Notifs = await notificationService.getUserNotifications(year3Student);
      expect(stu1Notifs.some((n) => n.title === 'Year 3 Internship Drive')).toBe(true);

      // Other year / other department student does not receive
      const stu11Notifs = await notificationService.getUserNotifications(year2Student);
      expect(stu11Notifs.some((n) => n.title === 'Year 3 Internship Drive')).toBe(false);
    });

    it('Department isolation: CE notice does NOT notify IT department students', async () => {
      const itStudentId = 'user-stu-12'; // Riya Sen (IT Year 2)

      await noticeService.createNotice({
        senderId: 'user-hod-ce',
        departmentId: 'dept-ce',
        audience: 'STUDENTS',
        title: 'CE Department Internal Sports Day',
        body: '<p>CE sports tournament.</p>',
      });

      const itNotifs = await notificationService.getUserNotifications(itStudentId);
      expect(
        itNotifs.some((n) => n.title === 'CE Department Internal Sports Day')
      ).toBe(false);
    });
  });

  /* ===================================================================
   * F. NOTIFICATION CENTER (Read Status, Counts, Mark All)
   * =================================================================== */
  describe('F. Notification Center Operations', () => {
    it('Can mark an individual notification as read and unread count decrements', async () => {
      const studentId = 'user-stu-1';
      const notifs = await notificationService.getUserNotifications(studentId);
      const unreadNotif = notifs.find((n) => !n.read);
      expect(unreadNotif).toBeDefined();

      const initialCount = await notificationService.getUnreadCount(studentId);

      const updated = await notificationService.markAsRead(unreadNotif!.id);
      expect(updated.read).toBe(true);

      const newCount = await notificationService.getUnreadCount(studentId);
      expect(newCount).toBe(initialCount - 1);
    });

    it('Can mark all notifications as read for a user', async () => {
      const studentId = 'user-stu-1';
      await notificationService.markAllAsRead(studentId);

      const count = await notificationService.getUnreadCount(studentId);
      expect(count).toBe(0);

      const notifs = await notificationService.getUserNotifications(studentId);
      expect(notifs.every((n) => n.read)).toBe(true);
    });
  });

  /* ===================================================================
   * G. CALENDAR & MEETING SCHEDULER
   * =================================================================== */
  describe('G. Calendar & Meeting Scheduler', () => {
    it('Aggregates calendar events including meetings, lectures, assignment deadlines and quizzes', async () => {
      const events = await calendarService.getEvents({
        userId: 'user-fac-neha',
        role: 'FACULTY',
        departmentId: 'dept-ce',
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.type === 'MEETING')).toBe(true);
      expect(events.some((e) => e.type === 'ASSIGNMENT')).toBe(true);
      expect(events.some((e) => e.type === 'QUIZ')).toBe(true);
    });

    it('Keeps the deadline of an unpublished draft off a student calendar', async () => {
      await assignmentService.createAssignment('class-1', {
        title: 'Secret Draft Lab',
        instructions: 'Not published yet',
        dueAt: '2026-10-20T10:00:00Z',
        maxMarks: 20,
        status: 'DRAFT',
      });

      const events = await calendarService.getEvents({
        userId: 'user-stu-1',
        role: 'STUDENT',
        departmentId: 'dept-ce',
      });

      expect(events.some((e) => e.type === 'ASSIGNMENT')).toBe(true);
      expect(events.some((e) => e.title.includes('Secret Draft Lab'))).toBe(false);
    });

    it('Scheduling a meeting creates event and notifies all participants', async () => {
      const creatorId = 'user-hod-ce';
      const participantId = 'user-fac-neha';

      const initialNotifs = await notificationService.getUserNotifications(participantId);

      const newMeeting = await calendarService.createMeeting({
        title: 'Accreditation Review Panel',
        description: 'Meeting to review department NBA criteria documents',
        startTime: '2026-10-18T11:00:00Z',
        endTime: '2026-10-18T12:00:00Z',
        creatorId,
        participantIds: [participantId],
        location: 'Board Room 1',
      });

      expect(newMeeting.id).toBeDefined();
      expect(newMeeting.title).toBe('Accreditation Review Panel');

      // Verify participant received meeting notification
      const updatedNotifs = await notificationService.getUserNotifications(participantId);
      expect(updatedNotifs.length).toBe(initialNotifs.length + 1);
      expect(
        updatedNotifs.some((n) => n.title.includes('Accreditation Review Panel'))
      ).toBe(true);
    });

    it('Meeting participants can be filtered using canInteract communication matrix', () => {
      const student = db.users.find((u) => u.id === 'user-stu-1')!;
      const assignedFaculty = db.users.find((u) => u.id === 'user-fac-neha')!;
      const unassignedFaculty = db.users.find((u) => u.id === 'user-fac-vivek')!;

      // Student can chat/meet with assigned faculty
      expect(canInteract(student, assignedFaculty, 'chat')).toBe(true);

      // Student cannot interact with faculty of other dept/unassigned course
      expect(canInteract(student, unassignedFaculty, 'chat')).toBe(false);
    });
  });
});
