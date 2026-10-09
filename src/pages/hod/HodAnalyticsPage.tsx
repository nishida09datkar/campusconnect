import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsService } from '@/api/services/analytics.service';
import { HodAnalytics } from '@/types/analytics';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, BookOpen, CheckCircle, TrendingUp } from 'lucide-react';

export const HodAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<HodAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getHodAnalytics()
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

  const totalAllocatedClasses = data.facultyWorkload.reduce((acc, f) => acc + f.classesCount, 0);
  const totalStudentsEnrolled = data.facultyWorkload.reduce((acc, f) => acc + f.studentCount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={`${data.departmentName} — Academic Analytics`}
        description="Faculty instructional workload, student attendance trajectories, and assignment submission rates"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Faculty Workload
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {totalAllocatedClasses} Classes
            </div>
            <span className="text-[11px] text-muted-foreground">across {data.facultyWorkload.length} instructors</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Department Submission Rate
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {data.submissionRate}%
            </div>
            <span className="text-[11px] text-muted-foreground">Term assignment completion</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Department Student Base
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {totalStudentsEnrolled} Enrollments
            </div>
            <span className="text-[11px] text-muted-foreground">Active course instances</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty Workload Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Faculty Allocation & Workload</h3>
              <p className="text-xs text-muted-foreground">Classes and student load per department faculty member</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.facultyWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="facultyName" tick={{ fontSize: 11 }} />
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
                <Bar dataKey="classesCount" fill="#3b82f6" name="Assigned Classes" radius={[4, 4, 0, 0]} />
                <Bar dataKey="studentCount" fill="#10b981" name="Student Reach" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Attendance Trend Line Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Department Attendance Progression</h3>
              <p className="text-xs text-muted-foreground">Weekly average lecture attendance trajectory</p>
            </div>
            <div className="p-2 bg-muted rounded-xl text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendanceTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="dateOrWeek" tick={{ fontSize: 12 }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #404040',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="attendancePercentage"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#8b5cf6' }}
                  activeDot={{ r: 7 }}
                  name="Attendance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HodAnalyticsPage;
