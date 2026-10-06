import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { calendarService } from '@/api/services/calendar.service';
import { userService } from '@/api/services/user.service';
import { CalendarEvent, CalendarEventType, User } from '@/types';
import { canInteract } from '@/utils/permissions';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from 'date-fns';

export const CalendarPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 8)); // October 2026 anchor from mock data
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Meeting scheduler dialog
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [meetingDate, setMeetingDate] = useState('2026-10-14');
  const [meetingStartTime, setMeetingStartTime] = useState('11:00');
  const [meetingEndTime, setMeetingEndTime] = useState('12:00');
  const [meetingLocation, setMeetingLocation] = useState('Seminar Hall B & Virtual Meet');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadCalendarData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const [eventsData, usersData] = await Promise.all([
        calendarService.getEvents({
          userId: currentUser.id,
          role: currentUser.role,
          departmentId: currentUser.departmentId,
        }),
        userService.getUsers({ pageSize: 100 }),
      ]);
      setEvents(eventsData);

      // Filter available meeting participants using Section 3.2 canInteract matrix!
      const eligibleUsers = usersData.items.filter((targetUser) =>
        canInteract(currentUser, targetUser, 'chat')
      );
      setAvailableUsers(eligibleUsers);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load calendar events';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Navigate calendar
  const handlePrev = () => {
    setCurrentDate((prev) => (viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1)));
  };

  const handleNext = () => {
    setCurrentDate((prev) => (viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1)));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 8)); // Navigate to current academic semester date
  };

  // Participant selection toggle
  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  // Submit Meeting
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!meetingTitle.trim()) newErrors.title = 'Meeting title is required';
    if (!meetingDate) newErrors.date = 'Date is required';
    if (!meetingStartTime) newErrors.startTime = 'Start time is required';
    if (!meetingEndTime) newErrors.endTime = 'End time is required';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const startIso = `${meetingDate}T${meetingStartTime}:00Z`;
      const endIso = `${meetingDate}T${meetingEndTime}:00Z`;

      await calendarService.createMeeting({
        title: meetingTitle.trim(),
        description: meetingDesc.trim() || undefined,
        startTime: startIso,
        endTime: endIso,
        creatorId: currentUser.id,
        participantIds: selectedParticipants,
        location: meetingLocation.trim() || 'Virtual Conference Room',
      });

      dispatch(
        addToast({
          type: 'success',
          message: `Meeting "${meetingTitle.trim()}" scheduled. Invitations sent to participants.`,
        })
      );

      // Reset & reload
      setIsScheduleOpen(false);
      setMeetingTitle('');
      setMeetingDesc('');
      setSelectedParticipants([]);
      setFormErrors({});
      await loadCalendarData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to schedule meeting';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Event badge styling helper
  const getEventBadge = (type: CalendarEventType) => {
    switch (type) {
      case 'MEETING':
        return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20';
      case 'LECTURE':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      case 'ASSIGNMENT':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'QUIZ':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';
      case 'EVENT':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStartDate = startOfWeek(monthStart);
  const calendarEndDate = endOfWeek(monthEnd);

  const monthDays = eachDayOfInterval({ start: calendarStartDate, end: calendarEndDate });
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: endOfWeek(currentDate),
  });

  const displayDays = viewMode === 'month' ? monthDays : weekDays;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Calendar & Schedule"
        description="Comprehensive schedule of department meetings, lectures, assignment deadlines, and quizzes"
        actions={
          <Button onClick={() => setIsScheduleOpen(true)} className="gap-2 shadow-sm text-xs">
            <Plus className="w-4 h-4" /> Schedule Meeting
          </Button>
        }
      />

      {/* Controls Bar: Navigation, Date display, View toggle */}
      <Card>
        <CardContent className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrev} className="h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleToday} className="h-8 px-3 text-xs">
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={handleNext} className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <h3 className="text-sm font-bold text-foreground ml-2">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
            </h3>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week View
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Main Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          ) : error ? (
            <div className="p-12 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm text-foreground font-semibold">{error}</p>
              <Button size="sm" variant="outline" onClick={loadCalendarData} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Day Name Headers */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs font-bold text-muted-foreground py-2.5">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
                {displayDays.map((day, idx) => {
                  const dayEvents = events.filter((evt) => {
                    const evtDate = new Date(evt.startTime);
                    return isSameDay(evtDate, day);
                  });

                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date(2026, 9, 8));

                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] p-1.5 sm:p-2 transition-colors flex flex-col justify-between ${
                        !isCurrentMonth ? 'bg-muted/10 opacity-50' : 'bg-card'
                      } ${isToday ? 'ring-1 ring-inset ring-primary-500/40 bg-primary-500/5' : ''}`}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'text-foreground/80'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold text-muted-foreground hidden sm:inline-block">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Day Events Pills */}
                      <div className="space-y-1 my-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((evt) => (
                          <button
                            key={evt.id}
                            onClick={() => setSelectedEvent(evt)}
                            className={`w-full text-left truncate px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all hover:scale-[1.01] ${getEventBadge(
                              evt.type
                            )}`}
                          >
                            {evt.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-muted-foreground font-semibold px-1">
                            +{dayEvents.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="h-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Event Detail Dialog */}
      <Dialog
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || 'Event Details'}
        description={`Scheduled on ${
          selectedEvent ? format(new Date(selectedEvent.startTime), 'EEEE, MMMM d, yyyy') : ''
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                selectedEvent ? getEventBadge(selectedEvent.type) : ''
              }`}
            >
              {selectedEvent?.type}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {selectedEvent &&
                `${format(new Date(selectedEvent.startTime), 'p')} – ${format(
                  new Date(selectedEvent.endTime),
                  'p'
                )}`}
            </span>
          </div>

          {selectedEvent?.description && (
            <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border">
              {selectedEvent.description}
            </p>
          )}

          {selectedEvent?.location && (
            <p className="text-xs text-foreground flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span>Location: {selectedEvent.location}</span>
            </p>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-border">
            {selectedEvent?.link ? (
              <a
                href={selectedEvent.link}
                className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
              >
                Go to Resource <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div />
            )}
            <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Department Meeting"
        description="Book a meeting session and notify permitted campus participants"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <Input
            label="Meeting Title *"
            placeholder="e.g. CE Curriculum Assessment or Faculty Council"
            value={meetingTitle}
            onChange={(e) => {
              setMeetingTitle(e.target.value);
              if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
            }}
            error={formErrors.title}
          />

          <Input
            label="Agenda & Description"
            placeholder="Key discussion points, topics, or reference notes"
            value={meetingDesc}
            onChange={(e) => setMeetingDesc(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Date *"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              error={formErrors.date}
            />
            <Input
              label="Start Time *"
              type="time"
              value={meetingStartTime}
              onChange={(e) => setMeetingStartTime(e.target.value)}
              error={formErrors.startTime}
            />
            <Input
              label="End Time *"
              type="time"
              value={meetingEndTime}
              onChange={(e) => setMeetingEndTime(e.target.value)}
              error={formErrors.endTime}
            />
          </div>

          <Input
            label="Location / Mode"
            placeholder="e.g. Seminar Hall B & Virtual Meet Room"
            value={meetingLocation}
            onChange={(e) => setMeetingLocation(e.target.value)}
          />

          {/* Participant Selector filtered by Section 3.2 canInteract! */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground/80">
              Invite Permitted Colleagues & Participants ({selectedParticipants.length} selected)
            </label>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-border p-2 space-y-1 bg-muted/20">
              {availableUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">
                  No permitted interaction contacts available.
                </p>
              ) : (
                availableUsers.map((u) => {
                  const isChecked = selectedParticipants.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleParticipant(u.id)}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary border-border bg-card"
                      />
                      <div className="flex-1 truncate">
                        <span className="font-semibold text-foreground">{u.name}</span>{' '}
                        <span className="text-[11px] text-muted-foreground">
                          ({u.role} — {u.designation || u.email})
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Participants are strictly filtered by institutional communication permission rules.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScheduleOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Book Meeting
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
