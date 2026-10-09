import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsService } from '@/api/services/analytics.service';
import { AdminAnalytics } from '@/types/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Building2, Users, GraduationCap, BookOpen, PhoneCall, MessageSquare } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getAdminAnalytics()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const pieData = Object.entries(data.userDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Campus Analytics & Intelligence"
        description="Real-time institutional indicators, activity volume, and demographic distribution"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Departments</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{data.totalDepartments}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Faculty</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{data.totalFaculty}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
            <GraduationCap className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{data.totalStudents}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Classes</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{data.activeClasses}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Calls / Week</span>
            <PhoneCall className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{data.callsThisWeek}</span>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Messages / Wk</span>
            <MessageSquare className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-bold text-foreground mt-2">{data.messagesThisWeek}</span>
        </Card>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Bar Chart */}
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Weekly Communication Velocity</h3>
            <p className="text-xs text-muted-foreground">Chat messages and call connections per weekday</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
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
                <Bar dataKey="messages" fill="#3b82f6" name="Chat Messages" radius={[4, 4, 0, 0]} />
                <Bar dataKey="calls" fill="#10b981" name="Voice/Video Calls" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User Distribution Pie Chart */}
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Campus Population Breakdown</h3>
            <p className="text-xs text-muted-foreground">Distribution across system roles</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent?: number }) =>
                    `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
    </div>
  );
};

export default AnalyticsPage;
