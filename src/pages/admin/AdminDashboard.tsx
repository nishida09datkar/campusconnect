import React from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/api/mock/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/common/RoleBadge';
import {
  Building2,
  Users,
  BookOpen,
  PhoneCall,
  UserCheck,
  TrendingUp,
  Plus,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const departmentsCount = db.departments.length;
  const facultyCount = db.users.filter((u) => u.role === 'FACULTY').length;
  const studentsCount = db.users.filter((u) => u.role === 'STUDENT').length;
  const classesCount = db.classes.length;
  const callsTodayCount = db.callLogs.length;

  const kpis = [
    {
      title: 'Departments',
      value: departmentsCount,
      desc: 'Active faculties & branches',
      icon: Building2,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      to: '/admin/departments',
    },
    {
      title: 'Faculty Members',
      value: facultyCount,
      desc: 'Teaching & HOD staff',
      icon: UserCheck,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
      to: '/admin/users',
    },
    {
      title: 'Enrolled Students',
      value: studentsCount,
      desc: 'Across CE & IT departments',
      icon: Users,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
      to: '/admin/users',
    },
    {
      title: 'Active Classrooms',
      value: classesCount,
      desc: 'Currently running semester',
      icon: BookOpen,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
      to: '/admin',
    },
    {
      title: 'VoIP Calls Logged',
      value: callsTodayCount,
      desc: 'Doubt & lecture sessions',
      icon: PhoneCall,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      to: '/calls/history',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institute Administration Dashboard"
        description="Campus-wide overview of academic departments, faculty allocations, student rosters, and system health"
        actions={
          <div className="flex gap-2">
            <Link to="/admin/users">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Users className="w-4 h-4" /> Manage Users
              </Button>
            </Link>
            <Link to="/admin/departments">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> New Department
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.title} to={kpi.to} className="group">
              <Card className="h-full hover:border-primary-500/40 transition-all hover:shadow-md">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {kpi.title}
                    </span>
                    <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">{kpi.value}</span>
                    <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary-600 transition-colors flex items-center justify-between">
                      <span>{kpi.desc}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Users & Departments Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Departments & Heads</CardTitle>
              <CardDescription>Academic units under institutional governance</CardDescription>
            </div>
            <Link to="/admin/departments" className="text-xs text-primary-600 hover:underline font-semibold">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {db.departments.map((dept) => {
              const hod = db.users.find((u) => u.id === dept.hodId);
              const courses = db.courses.filter((c) => c.departmentId === dept.id);
              const faculty = db.users.filter((u) => u.departmentId === dept.id && u.role === 'FACULTY');
              return (
                <div key={dept.id} className="py-3.5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{dept.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {dept.code}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      HOD: <span className="text-foreground font-medium">{hod?.name || 'Unassigned'}</span> &bull; {courses.length} Courses &bull; {faculty.length} Faculty
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Onboarded Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent User Roster</CardTitle>
              <CardDescription>Latest registered faculty and students</CardDescription>
            </div>
            <Link to="/admin/users" className="text-xs text-primary-600 hover:underline font-semibold">
              Manage all ({db.users.length})
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {db.users.slice(0, 5).map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-700 dark:text-primary-300 font-semibold text-xs flex items-center justify-center">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <RoleBadge role={u.role} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Health / Phase 1 Notice */}
      <Card className="border-primary-500/20 bg-primary-500/5">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600" /> Phase 1 Foundation Verified
            </h4>
            <p className="text-xs text-muted-foreground">
              Mock database loaded with {db.departments.length} departments, {db.users.length} users, and {db.classes.length} classrooms.
              Switch accounts anytime from the login page or profile dropdown.
            </p>
          </div>
          <Link to="/admin/analytics">
            <Button size="sm" variant="outline">
              Analytics Hub &rarr;
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
