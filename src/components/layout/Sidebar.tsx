import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { logoutUser } from '@/features/auth/authSlice';
import { toggleSidebar } from '@/features/ui/uiSlice';
import { RoleBadge } from '../common/RoleBadge';
import { Avatar } from '../ui/Avatar';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  BookOpen,
  MessageSquare,
  PhoneCall,
  Calendar,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  GraduationCap,
  Sparkles,
  GitBranch,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const isCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  if (!user) return null;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case 'ADMIN':
        return [
          { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
          { label: 'Departments', to: '/admin/departments', icon: Building2 },
          { label: 'Users & Roles', to: '/admin/users', icon: Users },
          { label: 'Campus Analytics', to: '/admin/analytics', icon: BarChart3 },
          { label: 'Department Notices', to: '/hod/notices', icon: Bell },
          { label: 'Academic Calendar', to: '/calendar', icon: Calendar },
          { label: 'Campus Chat', to: '/chat', icon: MessageSquare },
          { label: 'Call History', to: '/calls/history', icon: PhoneCall },
        ];
      case 'HOD':
        return [
          { label: 'Dashboard', to: '/hod', icon: LayoutDashboard },
          { label: 'Faculty Allocation', to: '/hod/allocation', icon: GitBranch },
          { label: 'Department Notices', to: '/hod/notices', icon: Bell },
          { label: 'Campus Chat', to: '/chat', icon: MessageSquare },
          { label: 'Call History', to: '/calls/history', icon: PhoneCall },
          { label: 'Academic Calendar', to: '/calendar', icon: Calendar },
        ];
      case 'FACULTY':
        return [
          { label: 'Dashboard', to: '/faculty', icon: LayoutDashboard },
          { label: 'My Classes', to: '/faculty/classes', icon: BookOpen },
          { label: 'Assignments', to: '/faculty/assignments', icon: FileText },
          { label: 'Messages & Doubts', to: '/chat', icon: MessageSquare },
          { label: 'Calls & Office Hours', to: '/calls/history', icon: PhoneCall },
          { label: 'Schedule & Calendar', to: '/calendar', icon: Calendar },
        ];
      case 'STUDENT':
        return [
          { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
          { label: 'My Classes', to: '/student/classes', icon: BookOpen },
          { label: 'Assignments', to: '/student/assignments', icon: FileText },
          { label: 'Doubts & Chat', to: '/chat', icon: MessageSquare },
          { label: 'Call History', to: '/calls/history', icon: PhoneCall },
          { label: 'Class Schedule', to: '/calendar', icon: Calendar },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={clsx(
        'hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 z-30 select-none',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-primary-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight truncate">
              <span className="font-bold text-base bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                CampusConnect
              </span>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                LMS & Unified Comms
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors hidden lg:flex"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Banner */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            <span>Active Portal</span>
          </div>
          <RoleBadge role={user.role} />
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20 font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  isCollapsed && 'justify-center px-0'
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {item.badge ? (
                <span
                  className={clsx(
                    'ml-auto rounded-full bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5',
                    isCollapsed && 'absolute top-1 right-2'
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border bg-card">
        <div
          className={clsx(
            'flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors',
            isCollapsed && 'justify-center p-0'
          )}
        >
          <Avatar src={user.avatarUrl} name={user.name} size={isCollapsed ? 'sm' : 'md'} />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
