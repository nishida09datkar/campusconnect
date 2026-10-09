import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { notificationService } from '@/api/services/notification.service';
import { AppNotification, NotificationType, Announcement } from '@/types';
import { db } from '@/api/mock/db';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { formatRelativeTime, formatDate } from '@/utils/format';
import { sanitizeHtml } from '@/utils/sanitize';
import {
  Bell,
  CheckCheck,
  Check,
  Filter,
  GraduationCap,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Paperclip,
  Download,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getUserNotifications(user.id);
      setNotifications(data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load notifications';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();

    const unsubscribe = notificationService.subscribe(() => {
      loadNotifications();
    });

    return () => unsubscribe();
  }, [loadNotifications]);

  // Open notice automatically if noticeId is present in URL
  useEffect(() => {
    const noticeId = searchParams.get('noticeId');
    if (noticeId) {
      const found = db.announcements.find((a) => a.id === noticeId);
      if (found) {
        setSelectedNotice(found);
      }
    }
  }, [searchParams]);

  const handleMarkAsRead = async (notif: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notif.read) return;
    try {
      const updated = await notificationService.markAsRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? updated : n)));
    } catch (err: unknown) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    setIsMarkingAll(true);
    try {
      const result = await notificationService.markAllAsRead(user.id);
      dispatch(
        addToast({
          type: 'success',
          message: `Marked ${result.count} notification(s) as read.`,
        })
      );
      await loadNotifications();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to mark all as read' }));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const findNoticeForNotification = (notif: AppNotification): Announcement | null => {
    // 1. By noticeId query param
    if (notif.link && notif.link.includes('noticeId=')) {
      const id = notif.link.split('noticeId=')[1]?.split('&')[0];
      const found = db.announcements.find((a) => a.id === id);
      if (found) return found;
    }

    // 2. Exact title match
    const exact = db.announcements.find(
      (a) => a.title.trim().toLowerCase() === notif.title.trim().toLowerCase()
    );
    if (exact) return exact;

    // 3. Partial title match
    const partial = db.announcements.find(
      (a) =>
        a.title.toLowerCase().includes(notif.title.toLowerCase()) ||
        notif.title.toLowerCase().includes(a.title.toLowerCase())
    );
    if (partial) return partial;

    return null;
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.type === 'NOTICE') {
      const notice = findNoticeForNotification(notif);
      if (notice) {
        setSelectedNotice(notice);
      } else {
        // Fallback using notification fields
        setSelectedNotice({
          id: notif.id,
          title: notif.title,
          body: notif.body,
          audience: 'ALL',
          senderId: 'user-hod-ce',
          createdAt: notif.createdAt,
          attachments: [],
        });
      }
      return;
    }

    if (notif.link && !notif.link.startsWith('/notifications')) {
      navigate(notif.link);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'NOTICE':
        return <Bell className="w-4 h-4 text-amber-500" />;
      case 'ASSIGNMENT':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'GRADE':
        return <GraduationCap className="w-4 h-4 text-emerald-500" />;
      case 'MESSAGE':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case 'CALL':
        return <PhoneCall className="w-4 h-4 text-rose-500" />;
      case 'LECTURE':
        return <Video className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-primary-500" />;
    }
  };

  const getAuthor = (senderId?: string) => {
    if (!senderId) return null;
    return db.users.find((u) => u.id === senderId) || null;
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (selectedType !== 'ALL' && n.type !== selectedType) return false;
      if (onlyUnread && n.read) return false;
      return true;
    });
  }, [notifications, selectedType, onlyUnread]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Institutional circulars, assignment updates, grading feedback, and schedule alerts"
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              isLoading={isMarkingAll}
              className="gap-2 shadow-sm text-xs"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </Button>
          )
        }
      />

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Type Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {['ALL', 'NOTICE', 'ASSIGNMENT', 'GRADE', 'MESSAGE', 'CALL', 'LECTURE'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  selectedType === type
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Unread Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground shrink-0">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary-600 focus:ring-primary-500"
            />
            <span>Unread Only ({unreadCount})</span>
          </label>
        </CardContent>
      </Card>

      {/* Notifications List Card */}
      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-foreground">
              Notifications ({filteredNotifications.length})
            </h3>
          </div>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
              {unreadCount} unread
            </span>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : error ? (
            <div className="p-12 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm text-foreground font-semibold">{error}</p>
              <Button size="sm" variant="outline" onClick={loadNotifications} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">No notifications found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {onlyUnread
                  ? 'You are all caught up! No unread notifications.'
                  : 'You do not have any notifications matching this filter category.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-4 sm:p-5 transition-colors flex items-start gap-4 cursor-pointer hover:bg-muted/40 ${
                    !notif.read ? 'bg-primary-500/5' : ''
                  }`}
                  data-testid={`notification-item-${notif.id}`}
                >
                  {/* Icon Box */}
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                      !notif.read ? 'bg-card shadow-sm border border-border' : 'bg-muted/60'
                    }`}
                  >
                    {getTypeIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs sm:text-sm font-bold text-foreground truncate ${
                            !notif.read ? 'text-foreground' : 'text-foreground/80'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {notif.type}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1 hover:underline">
                          View details <ExternalLink className="w-3 h-3" />
                        </span>
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif, e)}
                            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground text-[11px] flex items-center gap-1"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Notice Detail Dialog */}
      <Dialog
        isOpen={Boolean(selectedNotice)}
        onClose={() => {
          setSelectedNotice(null);
          if (searchParams.has('noticeId')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('noticeId');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        title={selectedNotice?.title || 'Notice Details'}
        description={
          selectedNotice
            ? `Published on ${formatDate(selectedNotice.createdAt, 'MMMM d, yyyy • h:mm a')}`
            : ''
        }
        className="max-w-2xl"
      >
        {selectedNotice && (
          <div className="space-y-4" data-testid="notice-detail-dialog">
            {/* Header Meta: Author / Department / Audience */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <Avatar
                  src={getAuthor(selectedNotice.senderId)?.avatarUrl}
                  name={getAuthor(selectedNotice.senderId)?.name || 'Campus Administration'}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {getAuthor(selectedNotice.senderId)?.name || 'Campus Administration'}
                    </span>
                    {getAuthor(selectedNotice.senderId) && (
                      <RoleBadge role={getAuthor(selectedNotice.senderId)!.role} size="sm" />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {getAuthor(selectedNotice.senderId)?.designation ||
                      (selectedNotice.departmentId ? 'Department Notice' : 'Campus-Wide Announcement')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-semibold">
                  Audience: {selectedNotice.audience}
                  {selectedNotice.year ? ` (Year ${selectedNotice.year})` : ''}
                </Badge>
                {selectedNotice.departmentId && (
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedNotice.departmentId.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>

            {/* Complete Notice Body */}
            <div
              className="p-4 rounded-xl border border-border bg-card text-foreground text-sm leading-relaxed whitespace-pre-wrap select-text max-h-[50vh] overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(selectedNotice.body),
              }}
            />

            {/* Attachments (if any) */}
            {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-primary-500" /> Attached Documents (
                  {selectedNotice.attachments.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedNotice.attachments.map((att) => (
                    <div
                      key={att.id}
                      onClick={() =>
                        dispatch(
                          addToast({ type: 'info', message: `Simulated download of ${att.name}` })
                        )
                      }
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs font-medium text-foreground cursor-pointer transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary-500" />
                      <span>{att.name}</span>
                      <span className="text-[10px] text-muted-foreground">({att.sizeKb} KB)</span>
                      <Download className="w-3 h-3 text-muted-foreground ml-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedNotice(null);
                  if (searchParams.has('noticeId')) {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete('noticeId');
                    setSearchParams(nextParams, { replace: true });
                  }
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default NotificationsPage;
