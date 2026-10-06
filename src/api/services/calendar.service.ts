import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { CalendarEvent, AppNotification, Role } from '@/types';
import { notificationService } from './notification.service';

export interface CalendarFilterParams {
  userId?: string;
  role?: Role;
  departmentId?: string;
}

export const calendarService = {
  async getEvents(filters: CalendarFilterParams = {}): Promise<CalendarEvent[]> {
    await delay(80, 160);

    // 1. Base events from db.events
    const baseEvents = [...db.events];

    // 2. Synthesize assignment deadlines as calendar events
    const assignmentEvents: CalendarEvent[] = db.assignments.map((assign) => {
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

    // Filter events based on user context
    if (filters.userId) {
      const uid = filters.userId;
      allEvents = allEvents.filter((evt) => {
        // Direct participant or creator
        if (evt.creatorId === uid) return true;
        if (evt.participantIds && evt.participantIds.includes(uid)) return true;

        // Department-wide event
        if (evt.departmentId && filters.departmentId && evt.departmentId === filters.departmentId) return true;

        // Class-specific event
        if (evt.classId) {
          const cls = db.classes.find((c) => c.id === evt.classId);
          if (cls) {
            if (cls.facultyId === uid) return true;
            if (cls.studentIds.includes(uid)) return true;
          }
        }

        // Campus-wide event (no specific department or class)
        if (!evt.departmentId && !evt.classId && (!evt.participantIds || evt.participantIds.length === 0)) {
          return true;
        }

        return false;
      });
    }

    return allEvents.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  },

  async createMeeting(payload: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    creatorId: string;
    participantIds: string[];
    location?: string;
  }): Promise<CalendarEvent> {
    await delay(120, 250);

    const title = payload.title.trim();
    if (!title) {
      throw { status: 400, message: 'Meeting title is required' };
    }

    const newMeetingEvent: CalendarEvent = {
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
    };

    db.events.push(newMeetingEvent);

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
          body: `${creatorName} scheduled a meeting with you on ${new Date(payload.startTime).toLocaleDateString()}.`,
          link: '/calendar',
          read: false,
          createdAt: new Date().toISOString(),
        };
        db.notifications.unshift(notif);
      }
    }

    notificationService.emitChange();

    return { ...newMeetingEvent };
  },
};
