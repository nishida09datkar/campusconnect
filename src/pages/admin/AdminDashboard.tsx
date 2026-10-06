import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { departmentService } from '@/api/services/department.service';
import { userService } from '@/api/services/user.service';
import { classroomService } from '@/api/services/classroom.service';
import { DepartmentWithDetails, User, ClassRoom } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Skeleton } from '@/components/ui/Skeleton';
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
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deptsData, usersData, classesData] = await Promise.all([
        departmentService.getDepartmentsWithDetails(),
        userService.getUsers({ pageSize: 100 }),
        classroomService.getAllClasses(),
      ]);
      setDepartments(deptsData);
      setUsers(usersData.items);
      setTotalUsers(usersData.total);
      setClasses(classesData);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load dashboard data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const facultyCount = users.filter((u) => u.role === 'FACULTY').length;
  const studentsCount = users.filter((u) => u.role === 'STUDENT').length;

  const kpis = [
    {
      title: 'Departments',
      value: departments.length,
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
      value: classes.length,
      desc: 'Currently running semester',
      icon: BookOpen,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
      to: '/admin',
    },
    {
      title: 'Total Users',
      value: totalUsers,
      desc: 'Active accounts on platform',
      icon: PhoneCall,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      to: '/admin/users',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm text-foreground font-semibold">{error}</p>
        <Button size="sm" variant="outline" onClick={loadData} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institute Administration Dashboard"
        description="Campus-wide overview of academic departments, faculty allocations, student rosters, and system health"
        actions={
          <div className="flex gap-2">
            <Link to="/admin/users">
              <Button size="sm" variant="outline" className="gap-1.5 shadow-sm text-xs">
                <Users className="w-4 h-4" /> Manage Users
              </Button>
            </Link>
            <Link to="/admin/departments">
              <Button size="sm" className="gap-1.5 shadow-sm text-xs">
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

      {/* Two Column Layout: Departments Overview & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Departments & Heads</CardTitle>
              <CardDescription>Academic units under institutional governance</CardDescription>
            </div>
            <Link to="/admin/departments" className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {departments.map((dept) => (
              <div key={dept.id} className="py-3.5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{dept.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {dept.code}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    HOD: <span className="text-foreground font-medium">{dept.hodName}</span> &bull;{' '}
                    {dept.courseCount} Courses &bull; {dept.facultyCount} Faculty
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Onboarded Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent User Roster</CardTitle>
              <CardDescription>Registered faculty, HODs, and student learners</CardDescription>
            </div>
            <Link to="/admin/users" className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold">
              Manage all ({totalUsers})
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border/60">
            {users.slice(0, 5).map((u) => (
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

      {/* System Health Card */}
      <Card className="border-primary-500/20 bg-primary-500/5">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Phase 3 Department Layer Active
            </h4>
            <p className="text-xs text-muted-foreground">
              Institutional departments, user accounts, course allocations, circulars, and notification center fully initialized.
            </p>
          </div>
          <Link to="/admin/departments">
            <Button size="sm" variant="outline">
              Departments Hub &rarr;
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
