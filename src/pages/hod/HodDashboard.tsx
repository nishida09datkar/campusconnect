import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { departmentService } from '@/api/services/department.service';
import { courseService } from '@/api/services/course.service';
import { userService } from '@/api/services/user.service';
import { noticeService } from '@/api/services/notice.service';
import { calendarService } from '@/api/services/calendar.service';
import { classroomService } from '@/api/services/classroom.service';
import { Department, Course, User, Announcement, CalendarEvent, ClassRoom } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/format';
import {
  Users,
  BookOpen,
  Bell,
  GitBranch,
  Send,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';

export const HodDashboard: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const deptId = currentUser?.departmentId || 'dept-ce';

  const [dept, setDept] = useState<Department | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        deptData,
        coursesData,
        facultyData,
        studentsData,
        noticesData,
        eventsData,
        classesData,
      ] = await Promise.all([
        departmentService.getDepartmentById(deptId),
        courseService.getCoursesByDepartment(deptId),
        userService.getDepartmentFaculty(deptId),
        userService.getDepartmentStudents(deptId),
        noticeService.getNotices({ departmentId: deptId }),
        calendarService.getEvents({ departmentId: deptId, userId: currentUser?.id }),
        classroomService.getAllClasses(),
      ]);

      setDept(deptData);
      setCourses(coursesData);
      setFaculty(facultyData);
      setStudents(studentsData);
      setNotices(noticesData);
      setEvents(eventsData.filter((e) => e.type === 'MEETING' || e.type === 'EVENT').slice(0, 3));
      setClasses(classesData);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load HOD dashboard data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [deptId, currentUser]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !dept) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-foreground">
          {error || 'Department profile could not be found'}
        </h3>
        <Button variant="outline" onClick={loadDashboardData} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Department Faculty',
      value: faculty.length,
      icon: Users,
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      to: '/hod/allocation',
    },
    {
      title: 'Active Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      to: '/hod/allocation',
    },
    {
      title: 'Department Students',
      value: students.length,
      icon: Users,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      to: '/hod/analytics',
    },
    {
      title: 'Circulars Broadcasted',
      value: notices.length,
      icon: Bell,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      to: '/hod/notices',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`HOD Portal — ${dept.name}`}
        description={`Department governance, faculty teaching allocations, circulars & student oversight for ${dept.code}`}
        actions={
          <div className="flex gap-2">
            <Link to="/hod/allocation">
              <Button size="sm" variant="outline" className="gap-1.5 shadow-sm text-xs">
                <GitBranch className="w-4 h-4" /> Course Allocation
              </Button>
            </Link>
            <Link to="/hod/notices">
              <Button size="sm" className="gap-1.5 shadow-sm text-xs">
                <Send className="w-4 h-4" /> Post Notice
              </Button>
            </Link>
          </div>
        }
      />

      {/* Department KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.title} to={kpi.to} className="group">
              <Card className="h-full hover:border-primary-500/40 transition-all hover:shadow-md">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase group-hover:text-primary-600 transition-colors">
                      {kpi.title}
                    </span>
                    <p className="text-2xl font-extrabold text-foreground">{kpi.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Workload and Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty Workload Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Faculty Teaching Workload</CardTitle>
              <CardDescription>Allocated courses per department professor</CardDescription>
            </div>
            <Link
              to="/hod/allocation"
              className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Manage &rarr;
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {faculty.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No faculty members registered in this department yet.
              </p>
            ) : (
              faculty.map((fac) => {
                const allocatedClasses = classes.filter((c) => c.facultyId === fac.id);
                return (
                  <div key={fac.id} className="py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">{fac.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {allocatedClasses.length > 0
                          ? allocatedClasses.map((c) => c.title).join(', ')
                          : 'No active allocations'}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
                      {allocatedClasses.length} Course{allocatedClasses.length === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Circulars & Notices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Department Circulars</CardTitle>
              <CardDescription>Notices broadcasted to faculty and students</CardDescription>
            </div>
            <Link
              to="/hod/notices"
              className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              Compose &rarr;
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No circulars published for {dept.code} yet.
              </p>
            ) : (
              notices.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{notice.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {formatDate(notice.createdAt)}
                    </span>
                  </div>
                  <div
                    className="text-xs text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: notice.body }}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] uppercase font-semibold text-primary-600 dark:text-primary-400">
                      Audience: {notice.audience}
                      {notice.year ? ` (Year ${notice.year})` : ''}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Published
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings & Department Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Upcoming Department Meetings & Events</CardTitle>
            <CardDescription>Scheduled calendar proceedings and council sessions</CardDescription>
          </div>
          <Link
            to="/calendar"
            className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1"
          >
            View Calendar &rarr;
          </Link>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No meetings scheduled for this week.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      {evt.type}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-foreground line-clamp-1">{evt.title}</h5>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {evt.description || 'Department meeting'}
                  </p>
                  {evt.location && (
                    <p className="text-[10px] text-muted-foreground font-medium pt-1 border-t border-border/50">
                      📍 {evt.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HodDashboard;
