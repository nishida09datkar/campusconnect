import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import { db } from '@/api/mock/db';
import { CalendarPage } from '@/pages/shared/CalendarPage';
import { NoticesPage } from '@/pages/hod/NoticesPage';

function renderAs(userId: string, page: React.ReactElement) {
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

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{page}</MemoryRouter>
      </Provider>
    ),
  };
}

describe('Phase 3 — Shared Pages', () => {
  const facultyId = 'user-fac-neha';

  beforeEach(() => {
    db.reset();
  });

  describe('Notice composer', () => {
    it('Drops the student year filter once the audience is no longer students only', async () => {
      const { container } = renderAs('user-hod-ce', <NoticesPage />);
      fireEvent.change(await screen.findByLabelText('Notice Subject / Headline *'), { target: { value: 'Hall Closed' } });
      fireEvent.change(container.querySelector('textarea')!, { target: { value: 'The seminar hall is closed on Friday.' } });

      fireEvent.click(screen.getByRole('button', { name: /students only/i }));
      fireEvent.change(screen.getByDisplayValue('All Academic Years (1 to 4)'), { target: { value: '1' } });
      fireEvent.click(screen.getByRole('button', { name: /faculty only/i }));
      fireEvent.click(screen.getByRole('button', { name: /broadcast notice/i }));

      await waitFor(() => expect(db.announcements.some((n) => n.title === 'Hall Closed')).toBe(true));
      const notice = db.announcements.find((n) => n.title === 'Hall Closed')!;
      expect(notice.audience).toBe('FACULTY');
      expect(notice.year).toBeUndefined();
    });
  });

  describe('Calendar meeting scheduler', () => {
    const openScheduler = async () => {
      renderAs(facultyId, <CalendarPage />);
      fireEvent.click(await screen.findByRole('button', { name: /schedule meeting/i }));
      fireEvent.change(screen.getByLabelText('Meeting Title *'), { target: { value: 'Syllabus Review' } });
    };

    it('Books a meeting at the time that was picked', async () => {
      await openScheduler();
      fireEvent.change(screen.getByLabelText('Date *'), { target: { value: '2026-10-14' } });
      fireEvent.change(screen.getByLabelText('Start Time *'), { target: { value: '11:00' } });
      fireEvent.change(screen.getByLabelText('End Time *'), { target: { value: '12:00' } });
      fireEvent.click(screen.getByRole('button', { name: /book meeting/i }));

      await waitFor(() => expect(db.events.some((e) => e.title === 'Syllabus Review')).toBe(true));
      const meeting = db.events.find((e) => e.title === 'Syllabus Review')!;
      expect(new Date(meeting.startTime).getTime()).toBe(new Date(2026, 9, 14, 11, 0).getTime());
      expect(new Date(meeting.endTime).getTime()).toBe(new Date(2026, 9, 14, 12, 0).getTime());
    });

    it('Refuses a meeting that ends before it starts', async () => {
      await openScheduler();
      fireEvent.change(screen.getByLabelText('Start Time *'), { target: { value: '12:00' } });
      fireEvent.change(screen.getByLabelText('End Time *'), { target: { value: '11:00' } });
      fireEvent.click(screen.getByRole('button', { name: /book meeting/i }));

      expect(await screen.findByText('End time must be after the start time')).toBeInTheDocument();
      expect(db.events.some((e) => e.title === 'Syllabus Review')).toBe(false);
    });
  });
});
