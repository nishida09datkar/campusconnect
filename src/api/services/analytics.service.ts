import { apiClient } from '../axios';
import { USE_MOCKS } from '../config';
import { db } from '../mock/db';
import {
  AdminAnalytics,
  HodAnalytics,
  FacultyAnalytics,
  StudentAnalytics,
} from '@/types/analytics';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const analyticsService = {
  async getAdminAnalytics(): Promise<AdminAnalytics> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<AdminAnalytics>('/analytics/admin');
      return res.data;
    }

    await delay(150);

    const facultyCount = db.users.filter((u) => u.role === 'FACULTY').length;
    const studentCount = db.users.filter((u) => u.role === 'STUDENT').length;
    const hodCount = db.users.filter((u) => u.role === 'HOD').length;
    const adminCount = db.users.filter((u) => u.role === 'ADMIN').length;

    return {
      totalDepartments: db.departments.length || 2,
      totalFaculty: Math.max(facultyCount, 3),
      totalStudents: Math.max(studentCount, 4),
      activeClasses: db.classes.length || 3,
      callsThisWeek: Math.max(db.callLogs.length, 12),
      messagesThisWeek: Math.max(db.messages.length, 36),
      weeklyActivity: [
        { day: 'Mon', messages: 14, calls: 3 },
        { day: 'Tue', messages: 22, calls: 5 },
        { day: 'Wed', messages: 18, calls: 4 },
        { day: 'Thu', messages: 31, calls: 7 },
        { day: 'Fri', messages: 26, calls: 6 },
        { day: 'Sat', messages: 12, calls: 2 },
        { day: 'Sun', messages: 8, calls: 1 },
      ],
      userDistribution: {
        Students: Math.max(studentCount, 4),
        Faculty: Math.max(facultyCount, 3),
        HODs: Math.max(hodCount, 2),
        Administrators: Math.max(adminCount, 1),
      },
    };
  },

  async getHodAnalytics(departmentId?: string): Promise<HodAnalytics> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<HodAnalytics>('/analytics/hod', {
        params: { departmentId },
      });
      return res.data;
    }

    await delay(150);
    const deptId = departmentId || 'dept-ce';
    const dept = db.departments.find((d) => d.id === deptId);

    return {
      departmentId: deptId,
      departmentName: dept?.name || 'Computer Engineering',
      submissionRate: 88.5,
      facultyWorkload: [
        { facultyId: 'user-fac-neha', facultyName: 'Prof. Neha Sharma', classesCount: 2, studentCount: 68 },
        { facultyId: 'user-fac-rohan', facultyName: 'Dr. Rohan Verma', classesCount: 1, studentCount: 42 },
        { facultyId: 'user-fac-anita', facultyName: 'Prof. Anita Sen', classesCount: 2, studentCount: 54 },
      ],
      attendanceTrend: [
        { dateOrWeek: 'Week 1', attendancePercentage: 94.0 },
        { dateOrWeek: 'Week 2', attendancePercentage: 89.5 },
        { dateOrWeek: 'Week 3', attendancePercentage: 86.0 },
        { dateOrWeek: 'Week 4', attendancePercentage: 91.0 },
        { dateOrWeek: 'Week 5', attendancePercentage: 92.4 },
      ],
    };
  },

  async getFacultyAnalytics(): Promise<FacultyAnalytics> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<FacultyAnalytics>('/analytics/faculty');
      return res.data;
    }

    await delay(150);

    return {
      facultyId: 'user-fac-neha',
      gradingProgress: [
        {
          classId: 'class-1',
          className: 'Web Development CE-A',
          gradedSubmissions: 38,
          pendingSubmissions: 7,
          totalSubmissions: 45,
        },
        {
          classId: 'class-2',
          className: 'Data Structures CE-B',
          gradedSubmissions: 29,
          pendingSubmissions: 11,
          totalSubmissions: 40,
        },
      ],
      attendanceHistory: [
        {
          classId: 'class-1',
          className: 'Web Development CE-A',
          averageAttendance: 91.2,
          totalSessions: 14,
        },
        {
          classId: 'class-2',
          className: 'Data Structures CE-B',
          averageAttendance: 85.8,
          totalSessions: 12,
        },
      ],
    };
  },

  async getStudentAnalytics(): Promise<StudentAnalytics> {
    if (!USE_MOCKS) {
      const res = await apiClient.get<StudentAnalytics>('/analytics/student');
      return res.data;
    }

    await delay(150);

    return {
      studentId: 'user-stu-1',
      overallAttendancePercentage: 92.5,
      presentSessions: 13,
      totalSessions: 14,
      gradesOverTime: [
        { assessmentTitle: 'Lab 1: React Basics', marks: 24, maxMarks: 25, percentage: 96, date: 'Sep 24' },
        { assessmentTitle: 'Quiz 1: State & Props', marks: 18, maxMarks: 20, percentage: 90, date: 'Sep 28' },
        { assessmentTitle: 'Lab 2: Redux Store', marks: 46, maxMarks: 50, percentage: 92, date: 'Oct 04' },
        { assessmentTitle: 'Midterm Evaluation', marks: 89, maxMarks: 100, percentage: 89, date: 'Oct 07' },
      ],
      submissionHistory: [
        { assignmentTitle: 'Lab 1: React Component Hierarchy', className: 'CS101', submittedAt: '2026-09-24T18:30:00Z', status: 'GRADED', onTime: true },
        { assignmentTitle: 'Lab 2: Redux Toolkit Store', className: 'CS101', submittedAt: '2026-10-04T19:15:00Z', status: 'GRADED', onTime: true },
        { assignmentTitle: 'Mini Project Phase 1', className: 'CS101', submittedAt: '2026-10-08T12:00:00Z', status: 'PENDING', onTime: true },
      ],
    };
  },
};
