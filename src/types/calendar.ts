export type CalendarEventType = 'ASSIGNMENT' | 'QUIZ' | 'LECTURE' | 'MEETING' | 'EVENT';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  type: CalendarEventType;
  creatorId?: string;
  creatorName?: string;
  departmentId?: string;
  classId?: string;
  participantIds?: string[];
  link?: string;
  location?: string;
  meetUrl?: string;
  googleCalendarEventUrl?: string;
  googleCalendarAddUrl?: string;
  googleEventId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  creatorId: string;
  participantIds: string[];
  location?: string;
  link?: string;
  meetUrl?: string;
  googleCalendarEventUrl?: string;
}
