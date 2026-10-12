import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { calendarService, buildGoogleCalendarAddUrl } from '@/api/services/calendar.service';
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
  Video,
  Calendar as CalendarIcon,
  Trash2,
  CalendarDays,
  List,
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
  addDays,
  subDays,
} from 'date-fns';

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export const CalendarPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);

  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 8)); // October 8, 2026 academic semester anchor
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Google Calendar Integration State
  const [googleStatus, setGoogleStatus] = useState<{
    configured: boolean;
    clientIdAvailable: boolean;
    connected?: boolean;
    provider: string;
  }>({
    configured: false,
    clientIdAvailable: false,
    connected: false,
    provider: 'Google Calendar API',
  });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Meeting scheduler dialog
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [meetingDate, setMeetingDate] = useState('2026-10-14');
  const [meetingStartTime, setMeetingStartTime] = useState('11:00');
  const [meetingEndTime, setMeetingEndTime] = useState('12:00');
  const [meetingLocation, setMeetingLocation] = useState('Seminar Hall B & Virtual Meet');
  const [attachGoogleMeet, setAttachGoogleMeet] = useState(true);
  const [customMeetUrl, setCustomMeetUrl] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadCalendarData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const [eventsData, usersData, gStatus] = await Promise.all([
        calendarService.getEvents({
          userId: currentUser.id,
          role: currentUser.role,
          departmentId: currentUser.departmentId,
        }),
        userService.getUsers({ pageSize: 100 }),
        calendarService.getGoogleCalendarStatus(),
      ]);
      setEvents(eventsData);
      setGoogleStatus(gStatus);

      // Filter eligible participants
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

  // Handle OAuth code return from Google Calendar authorization
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state) {
      window.history.replaceState({}, '', window.location.pathname);
      (async () => {
        try {
          const res = await calendarService.exchangeGoogleAuthCode({
            code,
            state,
            redirectUri: window.location.origin + '/calendar',
          });
          if (res.connected) {
            dispatch(addToast({ type: 'success', message: 'Google Calendar successfully connected!' }));
            loadCalendarData();
          } else {
            dispatch(addToast({ type: 'error', message: res.message || 'Failed to connect Google Calendar' }));
          }
        } catch {
          dispatch(addToast({ type: 'error', message: 'Failed to complete Google Calendar authorization' }));
        }
      })();
    }
  }, [dispatch, loadCalendarData]);

  // Navigate calendar
  const handlePrev = () => {
    setCurrentDate((prev) => {
      if (viewMode === 'month') return subMonths(prev, 1);
      if (viewMode === 'week') return subWeeks(prev, 1);
      if (viewMode === 'day') return subDays(prev, 1);
      return subWeeks(prev, 1);
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      if (viewMode === 'month') return addMonths(prev, 1);
      if (viewMode === 'week') return addWeeks(prev, 1);
      if (viewMode === 'day') return addDays(prev, 1);
      return addWeeks(prev, 1);
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 8)); // Return to academic anchor date
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, day));
    }
  };

  // Participant selection toggle
  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  // Google Calendar Connect or Disconnect action
  const handleConnectGoogle = async () => {
    if (googleStatus.connected) {
      setIsConnectingGoogle(true);
      try {
        await calendarService.disconnectGoogleCalendar();
        dispatch(addToast({ type: 'info', message: 'Disconnected Google Calendar account.' }));
        await loadCalendarData();
      } catch {
        dispatch(addToast({ type: 'error', message: 'Failed to disconnect Google Calendar.' }));
      } finally {
        setIsConnectingGoogle(false);
      }
      return;
    }

    setIsConnectingGoogle(true);
    try {
      const res = await calendarService.getGoogleConnectUrl(window.location.origin + '/calendar');
      if (res.status === 'unconfigured') {
        dispatch(
          addToast({
            type: 'warning',
            message: 'Google Client ID / Secret unconfigured on server. Please set environment variables.',
          })
        );
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch {
      dispatch(
        addToast({
          type: 'error',
          message: 'Unable to initiate Google Calendar authorization',
        })
      );
    } finally {
      setIsConnectingGoogle(false);
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
    else if (meetingStartTime && meetingEndTime <= meetingStartTime) {
      newErrors.endTime = 'End time must be after the start time';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      // The date and time inputs hold local time
      const startIso = new Date(`${meetingDate}T${meetingStartTime}:00`).toISOString();
      const endIso = new Date(`${meetingDate}T${meetingEndTime}:00`).toISOString();

      let manualMeetUrl: string | undefined = undefined;
      let requestGoogleMeet = false;

      if (attachGoogleMeet) {
        if (customMeetUrl.trim()) {
          const trimmed = customMeetUrl.trim();
          if (!trimmed.startsWith('https://meet.google.com/')) {
            newErrors.meetUrl = 'Meet URL must start with https://meet.google.com/';
            setFormErrors(newErrors);
            setIsSubmitting(false);
            return;
          }
          manualMeetUrl = trimmed;
        } else {
          // Request genuine Google Meet conference creation through connected Google account
          requestGoogleMeet = true;
        }
      }

      const createdEvent = await calendarService.createMeeting({
        title: meetingTitle.trim(),
        description: meetingDesc.trim() || undefined,
        startTime: startIso,
        endTime: endIso,
        creatorId: currentUser.id,
        participantIds: selectedParticipants,
        location: meetingLocation.trim() || 'Virtual Conference Room',
        meetUrl: manualMeetUrl,
        requestGoogleMeet,
      });

      let feedback = `Meeting "${meetingTitle.trim()}" scheduled.`;
      if (createdEvent.meetUrl) {
        feedback += ' Google Meet link attached.';
      } else if (attachGoogleMeet && !manualMeetUrl) {
        feedback += ' (Note: Google Calendar is not connected; connect Google Calendar to auto-create Meet links).';
      }
      feedback += ' Invitations sent.';

      dispatch(addToast({ type: 'success', message: feedback }));

      // Reset & reload
      setIsScheduleOpen(false);
      setMeetingTitle('');
      setMeetingDesc('');
      setCustomMeetUrl('');
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

  // Delete event
  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!window.confirm(`Are you sure you want to cancel and delete "${event.title}"?`)) return;
    setIsDeletingEvent(true);
    try {
      await calendarService.deleteEvent(event.id);
      dispatch(addToast({ type: 'success', message: 'Event removed from calendar' }));
      setSelectedEvent(null);
      await loadCalendarData();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete event' }));
    } finally {
      setIsDeletingEvent(false);
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

  const monthDays = useMemo(
    () => eachDayOfInterval({ start: calendarStartDate, end: calendarEndDate }),
    [calendarStartDate, calendarEndDate]
  );

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) }),
    [currentDate]
  );

  // Agenda list events
  const agendaEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [events]);

  const canManageEvent = (evt: CalendarEvent) => {
    if (!currentUser) return false;
    return (
      evt.creatorId === currentUser.id ||
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'HOD'
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Calendar & Schedule"
        description="Comprehensive university schedule of department meetings, lectures, assignment deadlines, and Google Meet conferences"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectGoogle}
              isLoading={isConnectingGoogle}
              className={`gap-2 text-xs ${
                googleStatus.connected
                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                  : 'border-primary-500/30 text-primary-600 dark:text-primary-400'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>
                {googleStatus.connected
                  ? 'Google Connected (Disconnect)'
                  : googleStatus.configured
                  ? 'Connect Google Calendar'
                  : 'Google Calendar (Unconfigured)'}
              </span>
            </Button>
            <Button onClick={() => setIsScheduleOpen(true)} className="gap-2 shadow-sm text-xs">
              <Plus className="w-4 h-4" /> Schedule Meeting
            </Button>
          </div>
        }
      />

      {/* Controls Bar: Navigation, Date selector, View toggle */}
      <Card>
        <CardContent className="p-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrev} className="h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleToday} className="h-8 px-3 text-xs">
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={handleNext} className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Date Input Selector */}
            <input
              type="date"
              aria-label="Jump to date"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="h-8 px-2 text-xs rounded-lg border border-border bg-card text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            />

            <h3 className="text-sm font-bold text-foreground ml-2">
              {format(
                currentDate,
                viewMode === 'month'
                  ? 'MMMM yyyy'
                  : viewMode === 'week'
                  ? "'Week of' MMM d, yyyy"
                  : 'EEEE, MMMM d, yyyy'
              )}
            </h3>
          </div>

          {/* View Mode Toggle: Month, Week, Day, Agenda */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            {(
              [
                { id: 'month', label: 'Month', icon: CalendarDays },
                { id: 'week', label: 'Week', icon: CalendarIcon },
                { id: 'day', label: 'Day', icon: Clock },
                { id: 'agenda', label: 'Agenda', icon: List },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === tab.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Calendar Display */}
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
          ) : viewMode === 'month' || viewMode === 'week' ? (
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
                {(viewMode === 'month' ? monthDays : weekDays).map((day, idx) => {
                  const dayEvents = events.filter((evt) => {
                    const evtDate = new Date(evt.startTime);
                    return isSameDay(evtDate, day);
                  });

                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date(2026, 9, 8));

                  return (
                    <div
                      key={idx}
                      className={`min-h-[115px] p-1.5 sm:p-2 transition-colors flex flex-col justify-between ${
                        !isCurrentMonth ? 'bg-muted/10 opacity-50' : 'bg-card'
                      } ${isToday ? 'ring-1 ring-inset ring-primary-500/40 bg-primary-500/5' : ''}`}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            setCurrentDate(day);
                            setViewMode('day');
                          }}
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                            isToday
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'text-foreground/80 hover:bg-muted'
                          }`}
                        >
                          {format(day, 'd')}
                        </button>
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
                            className={`w-full text-left truncate px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all hover:scale-[1.01] flex items-center justify-between gap-1 ${getEventBadge(
                              evt.type
                            )}`}
                          >
                            <span className="truncate">{evt.title}</span>
                            {evt.meetUrl && <Video className="w-2.5 h-2.5 shrink-0 text-emerald-500" />}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <button
                            onClick={() => {
                              setCurrentDate(day);
                              setViewMode('day');
                            }}
                            className="text-[9px] text-primary-600 dark:text-primary-400 font-semibold px-1 hover:underline text-left"
                          >
                            +{dayEvents.length - 3} more
                          </button>
                        )}
                      </div>

                      <div className="h-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === 'day' ? (
            /* Day View */
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h4 className="text-base font-bold text-foreground">
                  Events on {format(currentDate, 'EEEE, MMMM d, yyyy')}
                </h4>
                <span className="text-xs text-muted-foreground font-medium">
                  {events.filter((e) => isSameDay(new Date(e.startTime), currentDate)).length} scheduled
                </span>
              </div>

              {events.filter((e) => isSameDay(new Date(e.startTime), currentDate)).length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
                  <CalendarDays className="w-8 h-8 mx-auto opacity-40" />
                  <p>No events scheduled for this day.</p>
                  <Button size="sm" variant="outline" onClick={() => setIsScheduleOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Schedule Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {events
                    .filter((e) => isSameDay(new Date(e.startTime), currentDate))
                    .map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className="p-4 rounded-xl border border-border bg-card/60 hover:bg-muted/40 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEventBadge(evt.type)}`}>
                              {evt.type}
                            </span>
                            <h5 className="text-sm font-semibold text-foreground">{evt.title}</h5>
                          </div>
                          {evt.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{evt.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-primary-500" />
                              {format(new Date(evt.startTime), 'p')} – {format(new Date(evt.endTime), 'p')}
                            </span>
                            {evt.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                {evt.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {evt.meetUrl && (
                            <a
                              href={evt.meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Join Meet
                            </a>
                          )}
                          <a
                            href={evt.googleCalendarAddUrl || buildGoogleCalendarAddUrl(evt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground transition-all"
                          >
                            <CalendarIcon className="w-3.5 h-3.5 text-primary-500" />
                            Google Calendar
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            /* Agenda / List View */
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h4 className="text-base font-bold text-foreground">Complete Academic Agenda & Events</h4>
                <span className="text-xs text-muted-foreground">{agendaEvents.length} events total</span>
              </div>

              {agendaEvents.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs">
                  No upcoming academic events found.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {agendaEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="py-3 px-2 hover:bg-muted/30 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEventBadge(evt.type)}`}>
                            {evt.type}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{evt.title}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground/80">
                            <Clock className="w-3 h-3 text-primary-500" />
                            {format(new Date(evt.startTime), 'MMM d, yyyy · p')}
                          </span>
                          {evt.location && <span>· {evt.location}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {evt.meetUrl && (
                          <a
                            href={evt.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                          >
                            <Video className="w-3.5 h-3.5" /> Join Meet
                          </a>
                        )}
                        <a
                          href={evt.googleCalendarAddUrl || buildGoogleCalendarAddUrl(evt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-primary-500" /> Add to Calendar
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

          {/* Google Meet Banner if attached */}
          {selectedEvent?.meetUrl && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-600" />
                  Google Meet Conference
                </p>
                <p className="text-[11px] font-mono text-emerald-700/80 dark:text-emerald-400/80 truncate max-w-xs">
                  {selectedEvent.meetUrl}
                </p>
              </div>
              <a
                href={selectedEvent.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
              >
                <Video className="w-4 h-4" />
                Join Google Meet
              </a>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-wrap justify-between items-center pt-3 border-t border-border gap-2">
            <div className="flex items-center gap-2">
              {/* Google Calendar Add Action */}
              {selectedEvent && (
                <a
                  href={selectedEvent.googleCalendarAddUrl || buildGoogleCalendarAddUrl(selectedEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground transition-all"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-primary-500" />
                  Open in Google Calendar
                </a>
              )}

              {selectedEvent?.link && (
                <a
                  href={selectedEvent.link}
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
                >
                  Go to Resource <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedEvent && canManageEvent(selectedEvent) && (
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isDeletingEvent}
                  onClick={() => handleDeleteEvent(selectedEvent)}
                  className="gap-1 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Department Meeting"
        description="Book a meeting session, attach Google Meet, and notify permitted campus participants"
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

          {/* Google Meet Toggle */}
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground select-none">
              <input
                type="checkbox"
                checked={attachGoogleMeet}
                onChange={(e) => setAttachGoogleMeet(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-border"
              />
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <Video className="w-4 h-4" /> Attach Google Meet Conference
              </span>
            </label>

            {attachGoogleMeet && (
              <div className="space-y-1 pt-1">
                <input
                  type="url"
                  placeholder={
                    googleStatus.connected
                      ? 'Leave empty to auto-create via Google Calendar API, or paste Meet URL'
                      : 'Paste existing https://meet.google.com/xxx-xxxx-xxx link'
                  }
                  value={customMeetUrl}
                  onChange={(e) => setCustomMeetUrl(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-card text-foreground focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                {formErrors.meetUrl && (
                  <p className="text-[11px] text-rose-500 font-medium">{formErrors.meetUrl}</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {googleStatus.connected
                    ? 'Google Calendar is connected: a genuine Google Meet conference will be provisioned on event creation.'
                    : 'Google Calendar is not connected. Connect above to auto-create Meet links, or paste a link.'}
                </p>
              </div>
            )}
          </div>

          {/* Participant Selector */}
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
