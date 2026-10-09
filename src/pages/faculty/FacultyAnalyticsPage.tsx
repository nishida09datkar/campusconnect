import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsService } from '@/api/services/analytics.service';
import { FacultyAnalytics } from '@/types/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle2, Clock, CalendarCheck, BookOpen } from 'lucide-react';

export const FacultyAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<FacultyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getFacultyAnalytics()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalGraded = data.gradingProgress.reduce((a, b) => a + b.gradedSubmissions, 0);
  const totalPending = data.gradingProgress.reduce((a, b) => a + b.pendingSubmissions, 0);
  const totalSubmissions = totalGraded + totalPending;
  const completionRate = totalSubmissions > 0 ? Math.round((totalGraded / totalSubmissions) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Faculty Instructional Analytics"
        description="Submission grading velocity, evaluation queues, and classroom attendance summaries"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Evaluated Submissions
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">{totalGraded}</div>
            <span className="text-[11px] text-emerald-600 font-medium">{completionRate}% evaluated overall</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Evaluation
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">{totalPending}</div>
            <span className="text-[11px] text-muted-foreground">Action required</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Allocated Classrooms
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">{data.gradingProgress.length} Classes</div>
            <span className="text-[11px] text-muted-foreground">Active course batches</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grading Progress Stacked Bar Chart */}
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Grading Status by Classroom</h3>
            <p className="text-xs text-muted-foreground">Graded vs pending evaluation per class</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.gradingProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #404040',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="gradedSubmissions" stackId="a" fill="#10b981" name="Graded" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pendingSubmissions" stackId="a" fill="#f59e0b" name="Pending Evaluation" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Classroom Attendance Performance */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Classroom Attendance Rates</h3>
              <p className="text-xs text-muted-foreground">Average student attendance across course sections</p>
            </div>
            <div className="p-2 bg-muted rounded-xl text-primary">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendanceHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #404040',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                />
                <Bar dataKey="averageAttendance" fill="#3b82f6" name="Average Attendance %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FacultyAnalyticsPage;
