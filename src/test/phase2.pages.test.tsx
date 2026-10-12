import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import { db } from '@/api/mock/db';
import { assignmentService } from '@/api/services/assignment.service';
import { submissionService } from '@/api/services/submission.service';
import { AssignmentPage } from '@/pages/student/AssignmentPage';
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { StudentClassDetailPage } from '@/pages/student/StudentClassDetailPage';
import { FacultyDashboard } from '@/pages/faculty/FacultyDashboard';
import { ClassDetailPage } from '@/pages/faculty/ClassDetailPage';

const DAY_MS = 86_400_000;
const solution = { id: 'att-1', name: 'solution.zip', sizeKb: 10, mime: 'application/zip', url: '#' };

function renderAs(userId: string, path: string, linkTo?: string) {
  const store = configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState: {
      auth: {
        user: db.users.find((u) => u.id === userId)!,
        accessToken: 'test-mock-token',
        status: 'authenticated' as const,
        error: null,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {linkTo && <Link to={linkTo}>Follow link</Link>}
        <Routes>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/assignments/:id" element={<AssignmentPage />} />
          <Route path="/student/classes/:id" element={<StudentClassDetailPage />} />
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/classes/:id" element={<ClassDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('Phase 2 — Classroom LMS Pages', () => {
  const facultyId = 'user-fac-neha';
  const studentId = 'user-stu-1';
  const classId = 'class-1';

  const createAssignment = (title: string, overrides: { dueInDays?: number; status?: 'DRAFT' | 'PUBLISHED' } = {}) =>
    assignmentService.createAssignment(classId, {
      title,
      instructions: 'Test',
      dueAt: new Date(Date.now() + (overrides.dueInDays ?? 1) * DAY_MS).toISOString(),
      maxMarks: 20,
      status: overrides.status,
    });

  beforeEach(() => {
    db.reset();
  });

  describe('Student assignment page', () => {
    it('Does not offer to resubmit work that has already been graded', async () => {
      const assignment = await createAssignment('Graded Lab');
      const sub = await submissionService.submitAssignment(assignment.id, studentId, { files: [solution] });
      await submissionService.gradeSubmission(sub.id, { marks: 18 });

      renderAs(studentId, `/student/assignments/${assignment.id}`);

      expect(await screen.findByText('Graded Lab')).toBeInTheDocument();
      expect(screen.getByText('solution.zip')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /resubmit|turn in/i })).not.toBeInTheDocument();
    });

    it('Does not show an unpublished draft to a student who opens its link', async () => {
      const draft = await createAssignment('Secret Draft Lab', { status: 'DRAFT' });

      renderAs(studentId, `/student/assignments/${draft.id}`);

      expect(await screen.findByText('Assignment Not Found')).toBeInTheDocument();
      expect(screen.queryByText('Secret Draft Lab')).not.toBeInTheDocument();
    });
  });

  describe('Student assignment page, moving between assignments', () => {
    it('Starts a second assignment with an empty form instead of the file and note chosen for the first', async () => {
      const first = await createAssignment('First Lab');
      const second = await createAssignment('Second Lab');

      const { container } = renderAs(studentId, `/student/assignments/${first.id}`, `/student/assignments/${second.id}`);
      await screen.findByText('First Lab');
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: { files: [new File(['x'], 'first-lab-solution.zip')] },
      });
      fireEvent.change(container.querySelector('textarea')!, { target: { value: 'Note for the first lab' } });
      expect(screen.getByText('first-lab-solution.zip')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Follow link'));
      await screen.findByText('Second Lab');

      expect(screen.queryByText('first-lab-solution.zip')).not.toBeInTheDocument();
      expect(container.querySelector('textarea')!.value).toBe('');
    });
  });

  describe('Student class page', () => {
    it('Shows the item count on the Classwork tab before it is opened', async () => {
      const assignmentCount = db.assignments.filter((a) => a.classId === classId && a.status !== 'DRAFT').length;
      expect(assignmentCount).toBeGreaterThan(0);

      renderAs(studentId, `/student/classes/${classId}`);
      const classworkTab = await screen.findByRole('button', { name: /^classwork/i });

      expect(await within(classworkTab).findByText(String(assignmentCount))).toBeInTheDocument();
    });

    it('Shows late work in My Grades as awaiting grading, not as missing', async () => {
      const overdue = await createAssignment('Overdue Lab', { dueInDays: -1 });
      await submissionService.submitAssignment(overdue.id, studentId, { files: [solution] });

      renderAs(studentId, `/student/classes/${classId}`);
      fireEvent.click(await screen.findByRole('button', { name: /my grades/i }));

      const row = (await screen.findByText('Overdue Lab')).closest('tr')!;
      expect(within(row).getByText('Awaiting grading')).toBeInTheDocument();
    });
  });

  describe('Faculty class page', () => {
    it('Shows the item counts on the Assignments and Materials tabs before they are opened', async () => {
      const assignmentCount = db.assignments.filter((a) => a.classId === classId).length;
      const materialCount = db.materials.filter((m) => m.classId === classId).length;
      expect(assignmentCount).toBeGreaterThan(0);
      expect(materialCount).toBeGreaterThan(0);

      renderAs(facultyId, `/faculty/classes/${classId}`);
      const assignmentsTab = await screen.findByRole('button', { name: /^assignments/i });
      const materialsTab = screen.getByRole('button', { name: /^materials/i });

      expect(await within(assignmentsTab).findByText(String(assignmentCount))).toBeInTheDocument();
      expect(await within(materialsTab).findByText(String(materialCount))).toBeInTheDocument();
    });

    it('Gives every grade cell a column heading when Grades is the first tab opened', async () => {
      renderAs(facultyId, `/faculty/classes/${classId}`);
      fireEvent.click(await screen.findByRole('button', { name: /^grades/i }));

      const table = await screen.findByRole('table');
      const [headerRow, firstStudentRow] = within(table).getAllByRole('row');
      const headings = within(headerRow).getAllByRole('columnheader');

      expect(headings.length).toBeGreaterThan(4);
      expect(headings).toHaveLength(within(firstStudentRow).getAllByRole('cell').length);
    });
  });

  describe('Faculty attendance register', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("Opens on today's date just after midnight", async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 20, 0, 30));

      const { container } = renderAs(facultyId, `/faculty/classes/${classId}`);
      fireEvent.click(await screen.findByRole('button', { name: /^attendance/i }));
      await screen.findByText('Class Attendance Register');

      expect(container.querySelector<HTMLInputElement>('input[type="date"]')!.value).toBe('2026-11-20');
    });
  });

  describe('Faculty assignment form', () => {
    it('Keeps the deadline when an assignment is saved without changing its due date', async () => {
      const dueAt = '2026-11-20T10:30:00.000Z';
      const assignment = await assignmentService.createAssignment(classId, {
        title: 'Deadline Lab',
        instructions: 'Test',
        dueAt,
        maxMarks: 20,
      });

      renderAs(facultyId, `/faculty/classes/${classId}`);
      fireEvent.click(await screen.findByRole('button', { name: /^assignments/i }));
      const card = (await screen.findByText('Deadline Lab')).closest('div.flex-1')!.parentElement!;
      fireEvent.click(within(card).getByTitle('Edit Assignment'));
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument());

      expect(db.assignments.find((a) => a.id === assignment.id)!.dueAt).toBe(dueAt);
    });

    it('Defaults the deadline of a new assignment to 23:59', async () => {
      renderAs(facultyId, `/faculty/classes/${classId}`);
      fireEvent.click(await screen.findByRole('button', { name: /^assignments/i }));
      fireEvent.click(await screen.findByRole('button', { name: /create assignment/i }));

      expect(screen.getByLabelText<HTMLInputElement>('Due Date & Time').value).toMatch(/T23:59$/);
    });
  });

  describe('Dashboards', () => {
    it('Shows work that was turned in late as submitted on the student dashboard', async () => {
      const overdue = await createAssignment('Overdue Lab', { dueInDays: -1 });
      const sub = await submissionService.submitAssignment(overdue.id, studentId, { files: [solution] });
      expect(sub.status).toBe('LATE');

      renderAs(studentId, '/student');

      const row = screen.getByText('Overdue Lab').parentElement!.parentElement!;
      expect(within(row).getByText('Submitted')).toBeInTheDocument();
      expect(within(row).queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    });

    it('Leaves unpublished drafts off the student dashboard', async () => {
      await createAssignment('Secret Draft Lab', { status: 'DRAFT' });

      renderAs(studentId, '/student');

      expect(screen.getByText('Upcoming Lab Deadlines')).toBeInTheDocument();
      expect(screen.queryByText('Secret Draft Lab')).not.toBeInTheDocument();
    });

    it('Counts late submissions among the work a faculty member still has to grade', async () => {
      const pendingCount = () =>
        Number(within(screen.getByText('Pending Grading').parentElement!).getByText(/^\d+$/).textContent);

      const before = renderAs(facultyId, '/faculty');
      const countBefore = pendingCount();
      before.unmount();

      const overdue = await createAssignment('Overdue Lab', { dueInDays: -1 });
      await submissionService.submitAssignment(overdue.id, studentId, { files: [solution] });

      renderAs(facultyId, '/faculty');
      expect(pendingCount()).toBe(countBefore + 1);
    });
  });
});
