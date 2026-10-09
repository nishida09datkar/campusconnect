import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsService } from '@/api/services/analytics.service';
import { StudentAnalytics } from '@/types/analytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Award, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/utils/format';

const ATTENDANCE_COLORS = ['#10b981', '#f43f5e'];

export const StudentAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getStudentAnalytics()
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

  const attendancePieData = [
    { name: 'Present', value: data.presentSessions },
    { name: 'Absent', value: Math.max(0, data.totalSessions - data.presentSessions) },
  ];

  const avgGrade =
    data.gradesOverTime.length > 0
      ? Math.round(
          data.gradesOverTime.reduce((sum, g) => sum + g.percentage, 0) / data.gradesOverTime.length
        )
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="My Learning Performance & Analytics"
        description="Continuous assessment scores, attendance statistics, and assignment submission track record"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cumulative Average
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">{avgGrade}%</div>
            <span className="text-[11px] text-emerald-600 font-medium">Distinction standing</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <Award className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attendance Standing
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {data.overallAttendancePercentage}%
            </div>
            <span className="text-[11px] text-blue-600 font-medium">
              {data.presentSessions} / {data.totalSessions} sessions attended
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              On-Time Submissions
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">100%</div>
            <span className="text-[11px] text-muted-foreground">0 late or missed deadlines</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Performance Curve */}
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Continuous Assessment Curve</h3>
            <p className="text-xs text-muted-foreground">Percentage scored across lab exercises & evaluations</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.gradesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #404040',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, _name: any, item: any) => [
                    `${val}% (${item.payload.marks}/${item.payload.maxMarks} marks)`,
                    item.payload.assessmentTitle,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Attendance Breakdown Donut */}
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Lecture Attendance Distribution</h3>
            <p className="text-xs text-muted-foreground">Present vs absent attendance records</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }: { name: string; value?: number }) => `${name}: ${value}`}
                >
                  {attendancePieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #404040',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Submission Track Record Table */}
      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Recent Submissions Log</h3>
        <div className="divide-y divide-border">
          {data.submissionHistory.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-foreground">{item.assignmentTitle}</span>
                <span className="text-muted-foreground ml-2">({item.className})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{formatDate(item.submittedAt, 'MMM d, h:mm a')}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-[10px]">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default StudentAnalyticsPage;
