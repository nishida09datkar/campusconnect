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
  BookOpen,
  Award,
  MessageSquare,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);

  // Classes this student is enrolled in
  const studentClasses = db.classes.filter((c) => c.studentIds.includes(user?.id || ''));
  const classIds = studentClasses.map((c) => c.id);

  // Deadlines in enrolled classes
  const assignments = db.assignments.filter(
    (a) => classIds.includes(a.classId) && a.status !== 'DRAFT'
  );
  const submissions = db.submissions.filter((s) => s.studentId === user?.id);

  // Graded submissions
  const gradedSubmissions = submissions.filter((s) => s.status === 'GRADED');

  const kpis = [
    {
      title: 'Enrolled Classes',
      value: studentClasses.length,
      icon: BookOpen,
      color: 'bg-sky-500/10 text-sky-600',
      to: '/student/classes',
    },
    {
      title: 'Assignments Due',
      value: assignments.length,
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600',
      to: '/student/assignments',
    },
    {
      title: 'Graded Lab Work',
      value: gradedSubmissions.length,
      icon: Award,
      color: 'bg-emerald-500/10 text-emerald-600',
      to: '/student/assignments',
    },
    {
      title: 'Campus Doubts & Chat',
      value: 'Online',
      icon: MessageSquare,
      color: 'bg-indigo-500/10 text-indigo-600',
      to: '/chat',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.name || 'Student'}`}
        description={`Student portal & learning workspace • Roll: ${user?.rollNo || 'CE301'} • Year ${user?.year || 3} (Div ${user?.division || 'A'})`}
        actions={
          <div className="flex gap-2">
            <Link to="/student/classes">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="w-4 h-4" /> Join Class with Code
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
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

      {/* Enrolled Classes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">My Enrolled Courses</h3>
            <p className="text-xs text-muted-foreground">Select a course to view stream announcements, homework, and submit lab work</p>
          </div>
          <Link to="/student/classes" className="text-xs text-primary-600 font-semibold hover:underline">
            View all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {studentClasses.map((cls) => {
            const faculty = db.users.find((u) => u.id === cls.facultyId);
            return (
              <Card key={cls.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className={`h-24 p-4 bg-gradient-to-r ${cls.coverColor} text-white flex flex-col justify-between`}>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-black/20 w-fit">
                    Section {cls.section}
                  </span>
                  <h4 className="font-bold text-base truncate">{cls.title}</h4>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Course Instructor</p>
                    <p className="text-xs font-semibold text-foreground">{faculty?.name || 'Faculty'}</p>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <Link to={`/student/classes/${cls.id}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                        <span>Go to Classwork</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Deadlines and Recent Grades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Lab Deadlines</CardTitle>
            <CardDescription>Assignments due for submission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No assignments due!</p>
            ) : (
              assignments.map((assign) => {
                const sub = submissions.find((s) => s.assignmentId === assign.id);
                const isSubmitted =
                  sub?.status === 'SUBMITTED' || sub?.status === 'LATE' || sub?.status === 'GRADED';
                return (
                  <div key={assign.id} className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">{assign.title}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> Due: {formatDate(assign.dueAt, 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {isSubmitted ? (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> Submitted
                      </span>
                    ) : (
                      <Link to={`/student/assignments/${assign.id}`}>
                        <Button size="sm" variant="outline" className="text-xs shrink-0">
                          Submit
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Evaluation & Grades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Evaluated Work</CardTitle>
            <CardDescription>Scores and instructor feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {gradedSubmissions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No graded submissions yet.</p>
            ) : (
              gradedSubmissions.map((sub) => {
                const assign = assignments.find((a) => a.id === sub.assignmentId);
                return (
                  <div key={sub.id} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{assign?.title || 'Assignment'}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                        {sub.marks} / {assign?.maxMarks || 25} Marks
                      </span>
                    </div>
                    {sub.feedback && (
                      <p className="text-xs text-muted-foreground italic">&ldquo;{sub.feedback}&rdquo;</p>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
