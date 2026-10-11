import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { toggleTheme, addToast } from '@/features/ui/uiSlice';
import { notificationService } from '@/api/services/notification.service';
import { NotificationPreferences, EmailSendResult } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Button } from '@/components/ui/Button';
import {
  Sun,
  Moon,
  Bell,
  Mail,
  CheckCircle2,
  Send,
  AlertCircle,
  Clock,
  BookOpen,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const theme = useAppSelector((state) => state.ui.theme);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    inAppNotifications: true,
    assignmentAlerts: true,
    announcementAlerts: true,
    meetingAlerts: true,
    chatAlerts: false,
    attendanceAlerts: true,
    digestFrequency: 'IMMEDIATE',
  });

  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<EmailSendResult | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await notificationService.getPreferences();
        if (mounted) setPreferences(data);
      } catch {
        // Fallback to local default
      } finally {
        if (mounted) setIsLoadingPrefs(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!user) return null;

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      const updated = await notificationService.updatePreferences(preferences);
      setPreferences(updated);
      dispatch(addToast({ type: 'success', message: 'Notification preferences saved to backend database.' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update preferences.' }));
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const result = await notificationService.sendTestEmail();
      setTestResult(result);
      if (result.status === 'SENT') {
        dispatch(addToast({ type: 'success', message: `Test email dispatched to ${user.email}!` }));
      } else if (result.status === 'SUPPRESSED') {
        dispatch(addToast({ type: 'info', message: `Test email suppressed: ${result.message}` }));
      } else if (result.status === 'UNCONFIGURED') {
        dispatch(addToast({ type: 'warning', message: 'SMTP credentials unconfigured in backend environment.' }));
      } else {
        dispatch(addToast({ type: 'error', message: `Email delivery failed: ${result.message}` }));
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : 'Request failed';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account profile, role preferences, and real notification delivery settings"
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
            {user.departmentId && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Department</span>
                <span className="font-semibold uppercase">{user.departmentId}</span>
              </div>
            )}
            {user.rollNo && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Roll No</span>
                <span className="font-mono">{user.rollNo}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Status</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active Member
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Preferences & Notification Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Theme & Display */}
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
            </CardContent>
          </Card>

          {/* Real Email & Notification Preferences */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary-500" />
                  Email & Notification Delivery Settings
                </CardTitle>
                <CardDescription>
                  {isLoadingPrefs
                    ? 'Loading current notification preferences from backend...'
                    : `Server-side settings enforced by Spring Boot backend when dispatching notifications to ${user.email}`}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTestEmail}
                isLoading={isSendingTest}
                className="gap-1.5 text-xs border-primary-500/30 text-primary-600 dark:text-primary-400"
              >
                <Send className="w-3.5 h-3.5" /> Send Test Email
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    testResult.status === 'SENT'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : testResult.status === 'UNCONFIGURED'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {testResult.status === 'SENT' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>Status: {testResult.status}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                </div>
              )}

              {/* Master Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold">Master Email Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Deliver alerts to verified email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary border-border"
                  />
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold">In-App Notifications</p>
                    <p className="text-[11px] text-muted-foreground">Banner alerts and notifications menu</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.inAppNotifications}
                    onChange={(e) => setPreferences({ ...preferences, inAppNotifications: e.target.checked })}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary border-border"
                  />
                </div>
              </div>

              {/* Category-Level Notification Preferences */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-xs font-bold text-foreground">Notification Categories</h4>

                <div className="divide-y divide-border/60">
                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-rose-500" />
                      <div>
                        <p className="text-xs font-semibold">Assignments & Deadlines</p>
                        <p className="text-[11px] text-muted-foreground">Submissions, due-date alerts, marks and feedback</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.assignmentAlerts}
                      onChange={(e) => setPreferences({ ...preferences, assignmentAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary border-border"
                    />
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-xs font-semibold">Department Notices & Announcements</p>
                        <p className="text-[11px] text-muted-foreground">College circulars, department events, notices</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.announcementAlerts}
                      onChange={(e) => setPreferences({ ...preferences, announcementAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary border-border"
                    />
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-500" />
                      <div>
                        <p className="text-xs font-semibold">Meetings & Calendar Reminders</p>
                        <p className="text-[11px] text-muted-foreground">Scheduled meetings, Google Meet links, session invites</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.meetingAlerts}
                      onChange={(e) => setPreferences({ ...preferences, meetingAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary border-border"
                    />
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-xs font-semibold">Attendance & Academic Updates</p>
                        <p className="text-[11px] text-muted-foreground">Session attendance entries and threshold alerts</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.attendanceAlerts}
                      onChange={(e) => setPreferences({ ...preferences, attendanceAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary border-border"
                    />
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-500" />
                      <div>
                        <p className="text-xs font-semibold">Direct & Group Chat Email Alerts</p>
                        <p className="text-[11px] text-muted-foreground">Send email when offline and direct message received</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.chatAlerts}
                      onChange={(e) => setPreferences({ ...preferences, chatAlerts: e.target.checked })}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Digest Frequency */}
              <div className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-500" /> Email Digest Frequency
                  </p>
                  <p className="text-[11px] text-muted-foreground">How frequently email notifications are dispatched</p>
                </div>
                <select
                  value={preferences.digestFrequency}
                  onChange={(e) => setPreferences({ ...preferences, digestFrequency: e.target.value })}
                  className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="IMMEDIATE">Immediate (Real-Time)</option>
                  <option value="DAILY">Daily Digest</option>
                  <option value="WEEKLY">Weekly Summary</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={handleSavePreferences} isLoading={isSavingPrefs || isLoadingPrefs} disabled={isLoadingPrefs} className="gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
