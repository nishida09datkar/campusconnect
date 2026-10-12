import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { db } from '@/api/mock/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  ClipboardCheck,
  HelpCircle,
  Video,
  ArrowRight,
  Plus,
  Users,
  Copy,
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  const facultyClasses = db.classes.filter((c) => c.facultyId === user?.id);

  // Class IDs taught by this faculty
  const classIds = facultyClasses.map((c) => c.id);

  // Doubts raised in faculty classes
  const doubts = db.streamPosts.filter(
    (p) => classIds.includes(p.classId) && p.type === 'DOUBT'
  );
  const unresolvedDoubts = doubts.filter((d) => !d.resolved);

  // Submissions pending grading
  const assignments = db.assignments.filter((a) => classIds.includes(a.classId));
  const assignmentIds = assignments.map((a) => a.id);
  const pendingSubmissions = db.submissions.filter(
    (s) => assignmentIds.includes(s.assignmentId) && s.status === 'SUBMITTED'
  );

  const kpis = [
    {
      title: 'Assigned Classes',
      value: facultyClasses.length,
      icon: BookOpen,
      color: 'bg-teal-500/10 text-teal-600',
      to: '/faculty/classes',
    },
    {
      title: 'Pending Grading',
      value: pendingSubmissions.length,
      icon: ClipboardCheck,
      color: 'bg-amber-500/10 text-amber-600',
      to: '/faculty/assignments',
    },
    {
      title: 'Unresolved Doubts',
      value: unresolvedDoubts.length,
      icon: HelpCircle,
      color: 'bg-rose-500/10 text-rose-600',
      to: '/chat',
    },
    {
      title: 'Live Lectures',
      value: 'Ready',
      icon: Video,
      color: 'bg-indigo-500/10 text-indigo-600',
      to: 'https://meet.google.com/new',
      isExternal: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name || 'Professor'}`}
        description="Faculty Classroom hub: manage class streams, grade student lab submissions, and address academic doubts"
        actions={
          <div className="flex gap-2">
            <Link to="/faculty/classes">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Create Class
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const cardElement = (
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
          );

          return kpi.isExternal ? (
            <a
              key={kpi.title}
              href={kpi.to}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              {cardElement}
            </a>
          ) : (
            <Link key={kpi.title} to={kpi.to} className="group">
              {cardElement}
            </Link>
          );
        })}
      </div>

      {/* Classes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">My Teaching Classes</h3>
            <p className="text-xs text-muted-foreground">Click a class card to inspect the stream and student rosters</p>
          </div>
          <Link to="/faculty/classes" className="text-xs text-primary-600 font-semibold hover:underline">
            View all classes &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facultyClasses.map((cls) => {
            const course = db.courses.find((c) => c.id === cls.courseId);
            return (
              <Card key={cls.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className={`h-24 p-4 bg-gradient-to-r ${cls.coverColor} text-white flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-black/20">
                      {course?.code || 'CE301'}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(cls.classCode)}
                      title="Copy Class Code"
                      className="p-1 rounded bg-black/20 hover:bg-black/30 transition-colors flex items-center gap-1 text-[10px]"
                    >
                      <Copy className="w-3 h-3" />
                      {cls.classCode}
                    </button>
                  </div>
                  <h4 className="font-bold text-base truncate">{cls.title}</h4>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {cls.studentIds.length} Students enrolled
                    </span>
                    <span>Section {cls.section}</span>
                  </div>

                  <div className="pt-2 border-t border-border flex gap-2">
                    <Link to={`/faculty/classes/${cls.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                        <span>Open Classroom</span>
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
    </div>
  );
};

export default FacultyDashboard;
