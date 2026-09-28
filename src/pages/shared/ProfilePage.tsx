import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { toggleTheme, addToast } from '@/features/ui/uiSlice';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Button } from '@/components/ui/Button';
import { Sun, Moon, Bell, Shield, Mail, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const theme = useAppSelector((state) => state.ui.theme);

  if (!user) return null;

  const handleSavePreferences = () => {
    dispatch(addToast({ type: 'success', message: 'Preferences saved successfully' }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account profile, role preferences, and UI settings"
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Profile' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center items-center">
            <Avatar src={user.avatarUrl} name={user.name} size="xl" className="w-24 h-24 text-2xl mb-2" />
            <CardTitle>{user.name}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 justify-center mt-1">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </CardDescription>
            <div className="mt-3">
              <RoleBadge role={user.role} size="md" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-xs border-t border-border mt-2">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono font-medium">{user.id}</span>
            </div>
            {user.rollNo && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Roll Number</span>
                <span className="font-medium">{user.rollNo}</span>
              </div>
            )}
            {user.year && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Academic Year</span>
                <span className="font-medium">Year {user.year} (Div {user.division})</span>
              </div>
            )}
            {user.employeeId && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Employee ID</span>
                <span className="font-medium">{user.employeeId}</span>
              </div>
            )}
            {user.designation && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Designation</span>
                <span className="font-medium">{user.designation}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Account Status</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Preferences & Theme */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interface & Theme</CardTitle>
              <CardDescription>Customize your CampusConnect display and theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">Theme Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Currently using {theme === 'dark' ? 'Dark' : 'Light'} appearance
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => dispatch(toggleTheme())} className="gap-2">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary-500" /> In-App Ringtone & Call Alerts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Play sound effects for incoming 1:1 calls and classroom doubt requests
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" /> Privacy & Presence
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Show online status dot to enrolled classmates and assigned faculty
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary"
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleSavePreferences}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
