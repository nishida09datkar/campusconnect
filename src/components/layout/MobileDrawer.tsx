import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { logoutUser } from '@/features/auth/authSlice';
import { setMobileDrawerOpen } from '@/features/ui/uiSlice';
import { RoleBadge } from '../common/RoleBadge';
import { Avatar } from '../ui/Avatar';
import {
  X,
  GraduationCap,
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  BookOpen,
  MessageSquare,
  Calendar,
  Bell,
  LogOut,
  GitBranch,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';

export const MobileDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const isOpen = useAppSelector((state) => state.ui.mobileDrawerOpen);

  if (!isOpen || !user) return null;

  const handleClose = () => dispatch(setMobileDrawerOpen(false));

  const handleLogout = async () => {
    handleClose();
    await dispatch(logoutUser());
    navigate('/login');
  };

  const getNavItems = () => {
    switch (user.role) {
      case 'ADMIN':
        return [
          { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
          { label: 'Departments', to: '/admin/departments', icon: Building2 },
          { label: 'Users & Roles', to: '/admin/users', icon: Users },
          { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
          { label: 'Notices', to: '/hod/notices', icon: Bell },
          { label: 'Calendar', to: '/calendar', icon: Calendar },
          { label: 'Chat', to: '/chat', icon: MessageSquare },
        ];
      case 'HOD':
        return [
          { label: 'Dashboard', to: '/hod', icon: LayoutDashboard },
          { label: 'Allocation', to: '/hod/allocation', icon: GitBranch },
          { label: 'Analytics', to: '/hod/analytics', icon: BarChart3 },
          { label: 'Notices', to: '/hod/notices', icon: Bell },
          { label: 'Chat', to: '/chat', icon: MessageSquare },
          { label: 'Calendar', to: '/calendar', icon: Calendar },
        ];
      case 'FACULTY':
        return [
          { label: 'Dashboard', to: '/faculty', icon: LayoutDashboard },
          { label: 'My Classes', to: '/faculty/classes', icon: BookOpen },
          { label: 'Assignments', to: '/faculty/assignments', icon: FileText },
          { label: 'Analytics', to: '/faculty/analytics', icon: BarChart3 },
          { label: 'Chat & Doubts', to: '/chat', icon: MessageSquare },
          { label: 'Calendar', to: '/calendar', icon: Calendar },
        ];
      case 'STUDENT':
        return [
          { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
          { label: 'My Classes', to: '/student/classes', icon: BookOpen },
          { label: 'Assignments', to: '/student/assignments', icon: FileText },
          { label: 'Analytics', to: '/student/analytics', icon: BarChart3 },
          { label: 'Chat', to: '/chat', icon: MessageSquare },
          { label: 'Calendar', to: '/calendar', icon: Calendar },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer content */}
      <div className="relative w-72 max-w-[80vw] bg-card border-r border-border h-full flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-16 px-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CampusConnect
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User preview */}
        <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center gap-3">
          <Avatar src={user.avatarUrl} name={user.name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
            <RoleBadge role={user.role} />
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={navItems.some((other) => other.to.startsWith(`${item.to}/`))}
                onClick={handleClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
