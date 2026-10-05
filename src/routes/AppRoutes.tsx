import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { getRoleHomeRoute } from './roleRoutes';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';

// Loading fallback skeleton for Suspense
const PageSuspenseFallback: React.FC = () => (
  <div className="space-y-6 animate-pulse p-4">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64 rounded-xl" />
      <Skeleton className="h-4 w-96 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
    </div>
    <Skeleton className="h-72 rounded-2xl" />
  </div>
);

// Lazy loaded pages (Section 7 & 15)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const DepartmentsPage = lazy(() => import('@/pages/admin/DepartmentsPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));

// HOD pages
const HodDashboard = lazy(() => import('@/pages/hod/HodDashboard'));
const FacultyAllocationPage = lazy(() => import('@/pages/hod/FacultyAllocationPage'));
const NoticesPage = lazy(() => import('@/pages/hod/NoticesPage'));

// Faculty pages
const FacultyDashboard = lazy(() => import('@/pages/faculty/FacultyDashboard'));
const MyClassesPage = lazy(() => import('@/pages/faculty/MyClassesPage'));
const ClassDetailPage = lazy(() => import('@/pages/faculty/ClassDetailPage'));
const FacultyAssignmentsPage = lazy(() => import('@/pages/faculty/FacultyAssignmentsPage'));
const SubmissionsPage = lazy(() => import('@/pages/faculty/SubmissionsPage'));

// Student pages
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'));
const StudentClassesPage = lazy(() => import('@/pages/student/StudentClassesPage'));
const StudentClassDetailPage = lazy(() => import('@/pages/student/StudentClassDetailPage'));
const StudentAssignmentsPage = lazy(() => import('@/pages/student/StudentAssignmentsPage'));
const AssignmentPage = lazy(() => import('@/pages/student/AssignmentPage'));

// Shared pages
const ChatPage = lazy(() => import('@/pages/shared/ChatPage'));
const CallHistoryPage = lazy(() => import('@/pages/shared/CallHistoryPage'));
const LectureRoomPage = lazy(() => import('@/pages/shared/LectureRoomPage'));
const CalendarPage = lazy(() => import('@/pages/shared/CalendarPage'));
const NotificationsPage = lazy(() => import('@/pages/shared/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/shared/ProfilePage'));
const ForbiddenPage = lazy(() => import('@/pages/shared/ForbiddenPage'));
const NotFoundPage = lazy(() => import('@/pages/shared/NotFoundPage'));

// Root redirector based on auth state
const RootRedirector: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomeRoute(user.role)} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Root Redirect */}
        <Route path="/" element={<RootRedirector />} />

        {/* Authenticated Application Shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            {/* ADMIN Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/departments" element={<DepartmentsPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
            </Route>

            {/* HOD & ADMIN Shared Notices Route */}
            <Route element={<ProtectedRoute allowedRoles={['HOD', 'ADMIN']} />}>
              <Route path="/hod/notices" element={<NoticesPage />} />
            </Route>

            {/* HOD Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
              <Route path="/hod" element={<HodDashboard />} />
              <Route path="/hod/allocation" element={<FacultyAllocationPage />} />
            </Route>

            {/* FACULTY Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
              <Route path="/faculty" element={<FacultyDashboard />} />
              <Route path="/faculty/classes" element={<MyClassesPage />} />
              <Route path="/faculty/classes/:id" element={<ClassDetailPage />} />
              <Route path="/faculty/classes/:classId" element={<ClassDetailPage />} />
              <Route path="/faculty/assignments" element={<FacultyAssignmentsPage />} />
              <Route path="/faculty/assignments/:id/submissions" element={<SubmissionsPage />} />
            </Route>

            {/* STUDENT Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/classes" element={<StudentClassesPage />} />
              <Route path="/student/classes/:id" element={<StudentClassDetailPage />} />
              <Route path="/student/classes/:classId" element={<StudentClassDetailPage />} />
              <Route path="/student/assignments" element={<StudentAssignmentsPage />} />
              <Route path="/student/assignments/:id" element={<AssignmentPage />} />
            </Route>

            {/* FACULTY & STUDENT Shared Live Lecture Room */}
            <Route element={<ProtectedRoute allowedRoles={['FACULTY', 'STUDENT']} />}>
              <Route path="/lecture/:roomId" element={<LectureRoomPage />} />
            </Route>

            {/* All Roles Protected Routes */}
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
            <Route path="/calls/history" element={<CallHistoryPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* 404 Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
