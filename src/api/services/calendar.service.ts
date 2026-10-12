import { apiClient } from '../axios';
import { USE_MOCKS } from '../config';
import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { CalendarEvent, AppNotification, Role } from '@/types';
import { notificationService } from './notification.service';

export interface CalendarFilterParams {
  userId?: string;
  role?: Role;
  departmentId?: string;
}

export function buildGoogleCalendarAddUrl(evt: CalendarEvent): string {
  try {
    const title = encodeURIComponent(evt.title || 'CampusConnect Event');
    let desc = evt.description || '';
    if (evt.meetUrl) {
      desc += `\n\nGoogle Meet: ${evt.meetUrl}`;
    }
    const details = encodeURIComponent(desc);
    const loc = encodeURIComponent(evt.location || 'CampusConnect');

    let startClean = (evt.startTime || '').replace(/[-:]/g, '').split('.')[0];
    let endClean = (evt.endTime || evt.startTime || '').replace(/[-:]/g, '').split('.')[0];
    if (!startClean.endsWith('Z')) startClean += 'Z';
    if (!endClean.endsWith('Z')) endClean += 'Z';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startClean}/${endClean}&details=${details}&location=${loc}`;
  } catch {
    return 'https://calendar.google.com/calendar/u/0/r';
  }
}

export const calendarService = {
  async getEvents(filters: CalendarFilterParams = {}): Promise<CalendarEvent[]> {
    let backendEvents: CalendarEvent[] = [];
    if (!USE_MOCKS) {
      const res = await apiClient.get<CalendarEvent[]>('/api/calendar/events');
      backendEvents = res.data;
    }

    await delay(60, 120);

    // 1. Base events from backend or db.events
    const baseEvents = backendEvents.length > 0 ? backendEvents : [...db.events];

    // 2. Synthesize assignment deadlines as calendar events (students never see unpublished drafts)
    const visibleAssignments = db.assignments.filter(
      (assign) => filters.role !== 'STUDENT' || assign.status !== 'DRAFT'
    );
    const assignmentEvents: CalendarEvent[] = visibleAssignments.map((assign) => {
      const cls = db.classes.find((c) => c.id === assign.classId);
      return {
        id: `evt-assign-${assign.id}`,
        title: `Assignment: ${assign.title}`,
        description: `Due for ${cls ? cls.title : 'Class'} — Max Marks: ${assign.maxMarks}`,
        startTime: assign.dueAt,
        endTime: assign.dueAt,
        type: 'ASSIGNMENT',
        classId: assign.classId,
        link: filters.role === 'STUDENT' ? `/student/classes/${assign.classId}` : `/faculty/assignments`,
      };
    });

    // 3. Synthesize quizzes as calendar events
    const quizEvents: CalendarEvent[] = db.quizzes.map((quiz) => {
      const cls = db.classes.find((c) => c.id === quiz.classId);
      return {
        id: `evt-quiz-${quiz.id}`,
        title: `Quiz: ${quiz.title}`,
        description: `Assessment for ${cls ? cls.title : 'Class'} (${quiz.durationMin} mins)`,
        startTime: quiz.opensAt,
        endTime: quiz.closesAt,
        type: 'QUIZ',
        classId: quiz.classId,
        link: filters.role === 'STUDENT' ? `/student/classes/${quiz.classId}` : `/faculty/classes/${quiz.classId}`,
      };
    });

    // Combine all events
    let allEvents = [...baseEvents, ...assignmentEvents, ...quizEvents];

    // Filter events based on user context if needed
    if (filters.userId && backendEvents.length === 0) {
      const uid = filters.userId;
      allEvents = allEvents.filter((evt) => {
        if (evt.creatorId === uid) return true;
        if (evt.participantIds && evt.participantIds.includes(uid)) return true;
        if (evt.departmentId && filters.departmentId && evt.departmentId === filters.departmentId) return true;
        if (evt.classId) {
          const cls = db.classes.find((c) => c.id === evt.classId);
          if (cls) {
            if (cls.facultyId === uid) return true;
            if (cls.studentIds.includes(uid)) return true;
          }
        }
        if (!evt.departmentId && !evt.classId && (!evt.participantIds || evt.participantIds.length === 0)) {
          return true;
        }
        return false;
      });
    }

    // Attach googleCalendarAddUrl to all events
    return allEvents
      .map((evt) => ({
        ...evt,
        googleCalendarAddUrl: evt.googleCalendarAddUrl || buildGoogleCalendarAddUrl(evt),
      }))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },

  async createMeeting(payload: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    creatorId: string;
    participantIds: string[];
    location?: string;
    meetUrl?: string;
    requestGoogleMeet?: boolean;
  }): Promise<CalendarEvent> {
    const title = payload.title.trim();
    if (!title) {
      throw { status: 400, message: 'Meeting title is required' };
    }

    if (!USE_MOCKS) {
      // In live API mode: call backend directly without falling back silently on error
      const res = await apiClient.post<CalendarEvent>('/api/calendar/events', {
        title,
        description: payload.description?.trim(),
        startTime: payload.startTime,
        endTime: payload.endTime,
        type: 'MEETING',
        creatorId: payload.creatorId,
        participantIds: payload.participantIds,
        location: payload.location || 'Virtual Conference Room',
        meetUrl: payload.meetUrl,
        requestGoogleMeet: payload.requestGoogleMeet,
      });
      const created = res.data;
      created.googleCalendarAddUrl = buildGoogleCalendarAddUrl(created);
      return created;
    }

    await delay(100, 200);
    const created: CalendarEvent = {
      id: `evt-meet-${Date.now()}`,
      title,
      description: payload.description?.trim(),
      startTime: payload.startTime,
      endTime: payload.endTime,
      type: 'MEETING',
      creatorId: payload.creatorId,
      participantIds: Array.from(new Set([payload.creatorId, ...payload.participantIds])),
      location: payload.location || 'Campus Virtual Room',
      link: '/calendar',
      meetUrl: payload.meetUrl,
    };
    created.googleCalendarAddUrl = buildGoogleCalendarAddUrl(created);
    db.events.push(created);

    // Notify all participants except the creator
    const creator = db.users.find((u) => u.id === payload.creatorId);
    const creatorName = creator ? creator.name : 'A colleague';

    for (const participantId of payload.participantIds) {
      if (participantId !== payload.creatorId) {
        const notif: AppNotification = {
          id: `notif-${Date.now()}-${participantId}`,
          userId: participantId,
          type: 'NOTICE',
          title: `New Meeting Scheduled: ${title}`,
          body: `${creatorName} scheduled a meeting with you on ${new Date(payload.startTime).toLocaleDateString()}.${
            payload.meetUrl ? ' Includes Google Meet link.' : ''
          }`,
          link: '/calendar',
          read: false,
          createdAt: new Date().toISOString(),
        };
        db.notifications.unshift(notif);
      }
    }

    notificationService.emitChange();
    return { ...created };
  },

  async deleteEvent(eventId: string): Promise<void> {
    if (!USE_MOCKS) {
      await apiClient.delete(`/api/calendar/events/${eventId}`);
      return;
    }
    const idx = db.events.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      db.events.splice(idx, 1);
    }
  },

  async getGoogleCalendarStatus(): Promise<{ configured: boolean; clientIdAvailable: boolean; connected?: boolean; provider: string }> {
    if (USE_MOCKS) {
      return {
        configured: false,
        clientIdAvailable: false,
        connected: false,
        provider: 'Google Calendar API (Mock mode)',
      };
    }
    try {
      const res = await apiClient.get<{ configured: boolean; clientIdAvailable: boolean; connected?: boolean; provider: string }>(
        '/api/calendar/google/status'
      );
      return res.data;
    } catch {
      return {
        configured: false,
        clientIdAvailable: false,
        connected: false,
        provider: 'Google Calendar API (Unconfigured)',
      };
    }
  },

  async getGoogleConnectUrl(redirectUri?: string): Promise<{ url: string; status: string; state?: string }> {
    if (USE_MOCKS) {
      return {
        url: 'https://calendar.google.com/calendar/u/0/r',
        status: 'fallback',
      };
    }
    try {
      const res = await apiClient.get<{ url: string; status: string; state?: string }>('/api/calendar/google/connect-url', {
        params: redirectUri ? { redirectUri } : undefined,
      });
      return res.data;
    } catch {
      return {
        url: 'https://calendar.google.com/calendar/u/0/r',
        status: 'fallback',
      };
    }
  },

  async exchangeGoogleAuthCode(params: { code: string; state: string; redirectUri?: string }): Promise<{ success: boolean; connected: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; connected: boolean; message: string }>('/api/calendar/google/exchange', params);
    return res.data;
  },

  async disconnectGoogleCalendar(): Promise<{ connected: boolean; message: string }> {
    const res = await apiClient.post<{ connected: boolean; message: string }>('/api/calendar/google/disconnect');
    return res.data;
  },
};
