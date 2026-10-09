import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '@/features/auth/authSlice';
import { db } from '@/api/mock/db';
import { analyticsService } from '@/api/services/analytics.service';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';
import { HodAnalyticsPage } from '@/pages/hod/HodAnalyticsPage';
import { FacultyAnalyticsPage } from '@/pages/faculty/FacultyAnalyticsPage';
import { StudentAnalyticsPage } from '@/pages/student/StudentAnalyticsPage';

// Mock recharts responsive container for jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="mock-responsive-container" style={{ width: '500px', height: '300px' }}>
        {children}
      </div>
    ),
  };
});

function createTestStore(user: any) {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user,
        accessToken: 'test-mock-token',
        status: 'authenticated' as const,
        error: null,
      },
    },
  });
}

describe('Phase 6 — Analytics & Performance Hardening Tests', () => {
  const adminUser = db.users.find((u) => u.role === 'ADMIN')!;
  const hodUser = db.users.find((u) => u.role === 'HOD')!;
  const facultyUser = db.users.find((u) => u.role === 'FACULTY')!;
  const studentUser = db.users.find((u) => u.role === 'STUDENT')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Part A: Analytics Service Data Contract & Computation', () => {
    it('computes accurate admin analytics aggregates', async () => {
      const data = await analyticsService.getAdminAnalytics();

      expect(data).toBeDefined();
      expect(data.totalDepartments).toBeGreaterThanOrEqual(1);
      expect(data.totalFaculty).toBeGreaterThanOrEqual(1);
      expect(data.totalStudents).toBeGreaterThanOrEqual(1);
      expect(data.activeClasses).toBeGreaterThanOrEqual(1);
      expect(data.callsThisWeek).toBeGreaterThanOrEqual(0);
      expect(data.messagesThisWeek).toBeGreaterThanOrEqual(0);

      // Verify weekly active metrics
      expect(Array.isArray(data.weeklyActivity)).toBe(true);
      expect(data.weeklyActivity.length).toBe(7);

      // Verify user distribution object
      expect(data.userDistribution).toBeDefined();
      expect(data.userDistribution.Students).toBeGreaterThan(0);
      expect(data.userDistribution.Faculty).toBeGreaterThan(0);
    });

    it('computes HOD analytics scoped to department', async () => {
      const deptId = hodUser.departmentId || 'dept-ce';
      const data = await analyticsService.getHodAnalytics(deptId);

      expect(data).toBeDefined();
      expect(data.departmentId).toBe(deptId);
      expect(data.departmentName).toBeTruthy();
      expect(data.submissionRate).toBeGreaterThanOrEqual(0);
      expect(data.submissionRate).toBeLessThanOrEqual(100);

      // Verify faculty workload records
      expect(Array.isArray(data.facultyWorkload)).toBe(true);
      expect(data.facultyWorkload.length).toBeGreaterThan(0);
      expect(data.facultyWorkload[0]).toHaveProperty('facultyName');
      expect(data.facultyWorkload[0]).toHaveProperty('classesCount');

      // Verify attendance trend
      expect(Array.isArray(data.attendanceTrend)).toBe(true);
      expect(data.attendanceTrend.length).toBeGreaterThan(0);
    });

    it('computes Faculty analytics for assigned classes and grading', async () => {
      const data = await analyticsService.getFacultyAnalytics();

      expect(data).toBeDefined();
      expect(data.facultyId).toBeTruthy();

      // Verify grading progress
      expect(Array.isArray(data.gradingProgress)).toBe(true);
      if (data.gradingProgress.length > 0) {
        expect(data.gradingProgress[0]).toHaveProperty('className');
        expect(data.gradingProgress[0]).toHaveProperty('gradedSubmissions');
      }

      // Verify attendance history
      expect(Array.isArray(data.attendanceHistory)).toBe(true);
      if (data.attendanceHistory.length > 0) {
        expect(data.attendanceHistory[0]).toHaveProperty('className');
        expect(data.attendanceHistory[0]).toHaveProperty('averageAttendance');
      }
    });

    it('computes Student analytics for enrollment, attendance and performance', async () => {
      const data = await analyticsService.getStudentAnalytics();

      expect(data).toBeDefined();
      expect(data.studentId).toBeTruthy();
      expect(data.overallAttendancePercentage).toBeGreaterThanOrEqual(0);
      expect(data.overallAttendancePercentage).toBeLessThanOrEqual(100);
      expect(data.totalSessions).toBeGreaterThanOrEqual(0);

      // Verify grades over time
      expect(Array.isArray(data.gradesOverTime)).toBe(true);
      expect(Array.isArray(data.submissionHistory)).toBe(true);
    });
  });

  describe('Part B: Role-Based Analytics Dashboard Views', () => {
    it('renders Admin Analytics Dashboard with metrics and charts', async () => {
      const store = createTestStore(adminUser);

      render(
        <Provider store={store}>
          <MemoryRouter>
            <AnalyticsPage />
          </MemoryRouter>
        </Provider>
      );

      // Wait for loading to finish and page header to appear
      await waitFor(() => {
        expect(screen.getByText(/Campus Analytics & Intelligence/i)).toBeInTheDocument();
      });

      // KPI Cards
      expect(screen.getByText(/Departments/i)).toBeInTheDocument();
      expect(screen.getByText(/Faculty/i)).toBeInTheDocument();
      expect(screen.getByText(/Students/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Classes/i)).toBeInTheDocument();

      // Chart Sections
      expect(screen.getByText(/Weekly Communication Velocity/i)).toBeInTheDocument();
      expect(screen.getByText(/Campus Population Breakdown/i)).toBeInTheDocument();
    });

    it('renders HOD Analytics Dashboard with department workload overview', async () => {
      const store = createTestStore(hodUser);

      render(
        <Provider store={store}>
          <MemoryRouter>
            <HodAnalyticsPage />
          </MemoryRouter>
        </Provider>
      );

      // Wait for loaded header
      await waitFor(() => {
        expect(screen.getByText(/Academic Analytics/i)).toBeInTheDocument();
      });

      // KPI Cards
      expect(screen.getByText(/Faculty Workload/i)).toBeInTheDocument();
      expect(screen.getByText(/Department Submission Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Department Student Base/i)).toBeInTheDocument();

      // Chart titles
      expect(screen.getByText(/Faculty Allocation & Workload/i)).toBeInTheDocument();
      expect(screen.getByText(/Department Attendance Progression/i)).toBeInTheDocument();
    });

    it('renders Faculty Analytics Dashboard with class progress and grading queues', async () => {
      const store = createTestStore(facultyUser);

      render(
        <Provider store={store}>
          <MemoryRouter>
            <FacultyAnalyticsPage />
          </MemoryRouter>
        </Provider>
      );

      // Wait for loaded header
      await waitFor(() => {
        expect(screen.getByText(/Faculty Instructional Analytics/i)).toBeInTheDocument();
      });

      // Metrics
      expect(screen.getByText(/Evaluated Submissions/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Pending Evaluation/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Allocated Classrooms/i)).toBeInTheDocument();

      // Charts
      expect(screen.getByText(/Grading Status by Classroom/i)).toBeInTheDocument();
      expect(screen.getByText(/Classroom Attendance Rates/i)).toBeInTheDocument();
    });

    it('renders Student Analytics Dashboard with academic summary and attendance', async () => {
      const store = createTestStore(studentUser);

      render(
        <Provider store={store}>
          <MemoryRouter>
            <StudentAnalyticsPage />
          </MemoryRouter>
        </Provider>
      );

      // Wait for loaded header
      await waitFor(() => {
        expect(screen.getByText(/My Learning Performance & Analytics/i)).toBeInTheDocument();
      });

      // Metrics
      expect(screen.getByText(/Cumulative Average/i)).toBeInTheDocument();
      expect(screen.getByText(/Attendance Standing/i)).toBeInTheDocument();
      expect(screen.getByText(/On-Time Submissions/i)).toBeInTheDocument();

      // History section
      expect(screen.getByText(/Continuous Assessment Curve/i)).toBeInTheDocument();
      expect(screen.getByText(/Lecture Attendance Distribution/i)).toBeInTheDocument();
      expect(screen.getByText(/Recent Submissions Log/i)).toBeInTheDocument();
    });
  });
});
