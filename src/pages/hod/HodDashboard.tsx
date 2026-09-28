import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { db } from '@/api/mock/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/format';
import {
  Users,
  BookOpen,
  Bell,
  GitBranch,
  Calendar,
  Send,
  CheckCircle,
} from 'lucide-react';

export const HodDashboard: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  const deptId = user?.departmentId || 'dept-ce';
  const dept = db.departments.find((d) => d.id === deptId) || db.departments[0];

  const deptCourses = db.courses.filter((c) => c.departmentId === dept.id);
  const deptFaculty = db.users.filter((u) => u.departmentId === dept.id && u.role === 'FACULTY');
  const deptStudents = db.users.filter((u) => u.departmentId === dept.id && u.role === 'STUDENT');
  const deptNotices = db.announcements.filter((a) => a.departmentId === dept.id || a.senderId === user?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`HOD Portal — ${dept.name}`}
        description={`Department governance, faculty teaching allocations, circulars & student oversight for ${dept.code}`}
        actions={
          <div className="flex gap-2">
            <Link to="/hod/allocation">
              <Button size="sm" variant="outline" className="gap-1.5">
                <GitBranch className="w-4 h-4" /> Course Allocation
              </Button>
            </Link>
            <Link to="/hod/notices">
              <Button size="sm" className="gap-1.5">
                <Send className="w-4 h-4" /> Post Notice
              </Button>
            </Link>
          </div>
        }
      />

      {/* Department KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Department Faculty</span>
              <p className="text-2xl font-extrabold text-foreground">{deptFaculty.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Active Courses</span>
              <p className="text-2xl font-extrabold text-foreground">{deptCourses.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Department Students</span>
              <p className="text-2xl font-extrabold text-foreground">{deptStudents.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Circulars Broadcasted</span>
              <p className="text-2xl font-extrabold text-foreground">{deptNotices.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
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
            <Link to="/hod/allocation" className="text-xs text-primary-600 font-semibold hover:underline">
              Manage &rarr;
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {deptFaculty.map((fac) => {
              const allocatedClasses = db.classes.filter((c) => c.facultyId === fac.id);
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600">
                    {allocatedClasses.length} Course{allocatedClasses.length === 1 ? '' : 's'}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Circulars & Notices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Department Circulars</CardTitle>
              <CardDescription>Notices broadcasted to faculty and students</CardDescription>
            </div>
            <Link to="/hod/notices" className="text-xs text-primary-600 font-semibold hover:underline">
              Compose &rarr;
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {deptNotices.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No notices issued yet.</p>
            ) : (
              deptNotices.map((notice) => (
                <div key={notice.id} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{notice.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {formatDate(notice.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{notice.body}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] uppercase font-semibold text-primary-600">
                      Audience: {notice.audience}
                    </span>
                    <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Sent
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings banner */}
      <Card className="border-border bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-600 text-white shadow-md shadow-primary-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Upcoming Academic Calendar Events</h4>
              <p className="text-xs text-muted-foreground">
                Midterm progress reviews and department council meeting scheduled for this month.
              </p>
            </div>
          </div>
          <Link to="/calendar">
            <Button size="sm" variant="outline">
              Open Calendar
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default HodDashboard;
