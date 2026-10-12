import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { noticeService } from '@/api/services/notice.service';
import { classroomService } from '@/api/services/classroom.service';
import { Announcement, NoticeAudience, ClassRoom, Attachment } from '@/types';
import { sanitizeHtml } from '@/utils/sanitize';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/format';
import {
  Bell,
  Send,
  History,
  Eye,
  RotateCcw,
  Bold,
  Italic,
  List,
  Heading2,
  Quote,
  Code,
  Paperclip,
  CheckCircle,
  Users,
  GraduationCap,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FileText,
  X,
} from 'lucide-react';

export const NoticesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const deptId = currentUser?.departmentId || (currentUser?.role === 'ADMIN' ? undefined : 'dept-ce');

  // Tabs
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

  // Notices data
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Composer Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<NoticeAudience>('ALL');
  const [targetYear, setTargetYear] = useState<string>('ALL');
  const [targetClassId, setTargetClassId] = useState<string>('ALL');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  // View Notice Modal
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [noticesData, classesData] = await Promise.all([
        noticeService.getNotices({ departmentId: deptId }),
        classroomService.getAllClasses(),
      ]);
      setNotices(noticesData);
      setClasses(deptId ? classesData.filter((c) => c.courseId.includes(deptId.replace('dept-', ''))) : classesData);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load notices';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [deptId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Insert HTML tag into rich text textarea
  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    const replacement = `${openTag}${selectedText || 'text'}${closeTag}`;

    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + (selectedText.length || 4));
    }, 0);
  };

  // Add dummy file attachment
  const handleAddAttachment = () => {
    const dummyName = `Notice_Circular_Doc_${Date.now().toString().slice(-4)}.pdf`;
    setAttachments([
      ...attachments,
      {
        id: `att-${Date.now()}`,
        name: dummyName,
        sizeKb: 340,
        mime: 'application/pdf',
        url: '#',
      },
    ]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  // Submit Notice
  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; body?: string } = {};

    if (!title.trim()) newErrors.title = 'Notice title is required';
    if (!body.trim()) newErrors.body = 'Notice content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // The year and class filters are only offered (and only apply) for a students-only notice
    const studentsOnly = audience === 'STUDENTS';

    setIsSubmitting(true);
    try {
      await noticeService.createNotice({
        senderId: currentUser?.id || 'user-hod-ce',
        departmentId: deptId,
        audience,
        year: studentsOnly && targetYear !== 'ALL' ? Number(targetYear) : undefined,
        classId: studentsOnly && targetClassId !== 'ALL' ? targetClassId : undefined,
        title: title.trim(),
        body: body.trim(),
        attachments,
      });

      dispatch(
        addToast({
          type: 'success',
          message: `Notice published successfully! Notifications sent to target ${audience.toLowerCase()}.`,
        })
      );

      // Reset form
      setTitle('');
      setBody('');
      setAudience('ALL');
      setTargetYear('ALL');
      setTargetClassId('ALL');
      setAttachments([]);
      setPreviewMode(false);
      setErrors({});

      // Switch to history tab and reload
      setActiveTab('history');
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to publish notice';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend notice
  const handleResendNotice = async (notice: Announcement) => {
    try {
      await noticeService.createNotice({
        senderId: currentUser?.id || notice.senderId,
        departmentId: notice.departmentId,
        audience: notice.audience,
        year: notice.year,
        classId: notice.classId,
        title: `[Resent] ${notice.title}`,
        body: notice.body,
        attachments: notice.attachments,
      });
      dispatch(
        addToast({
          type: 'success',
          message: `Notice "${notice.title}" rebroadcasted with fresh notifications.`,
        })
      );
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to resend notice';
      dispatch(addToast({ type: 'error', message: msg }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Notices & Announcements"
        description="Broadcast circulars, official decrees, and event updates with granular audience targeting"
      />

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('compose')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'compose'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Send className="w-3.5 h-3.5" /> Compose Notice
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Notice History ({notices.length})
        </button>
      </div>

      {activeTab === 'compose' ? (
        /* NOTICE COMPOSER */
        <div className="max-w-4xl">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" /> Notice Composer
              </CardTitle>
              <CardDescription>
                Formulate circular with rich text formatting and choose audience targeting
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmitNotice} className="space-y-5">
                {/* Notice Title */}
                <Input
                  label="Notice Subject / Headline *"
                  placeholder="e.g. Mandatory Department Meeting or Midterm Schedule"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors({ ...errors, title: '' });
                  }}
                  error={errors.title}
                />

                {/* Audience Targeting */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Users className="w-4 h-4 text-primary-500" />
                    Target Audience Delivery
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setAudience('ALL')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        audience === 'ALL'
                          ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300 font-bold'
                          : 'border-border bg-card text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground">All Members</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Both faculty & students
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAudience('FACULTY')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        audience === 'FACULTY'
                          ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold'
                          : 'border-border bg-card text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-teal-500" /> Faculty Only
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Exclusively teaching staff
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAudience('STUDENTS')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        audience === 'STUDENTS'
                          ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold'
                          : 'border-border bg-card text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-500" /> Students Only
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Enrolled student cohorts
                      </p>
                    </button>
                  </div>

                  {/* Conditional Granular Student Filters */}
                  {audience === 'STUDENTS' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60 animate-in fade-in">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-foreground/80">
                          Target Year (Optional Filter)
                        </label>
                        <select
                          value={targetYear}
                          onChange={(e) => setTargetYear(e.target.value)}
                          className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        >
                          <option value="ALL">All Academic Years (1 to 4)</option>
                          <option value="1">Year 1</option>
                          <option value="2">Year 2</option>
                          <option value="3">Year 3</option>
                          <option value="4">Year 4</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-foreground/80">
                          Target Classroom (Optional Filter)
                        </label>
                        <select
                          value={targetClassId}
                          onChange={(e) => setTargetClassId(e.target.value)}
                          className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        >
                          <option value="ALL">All Enrolled Classes</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.title} (Sec {cls.section})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rich Text Body & Toolbar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-foreground/80">
                      Notice Content (Rich Text) *
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewMode(false)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          !previewMode ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode(true)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          previewMode ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {!previewMode ? (
                    <div className="rounded-xl border border-input bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                      {/* Rich Text Toolbar */}
                      <div className="flex items-center flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
                        <button
                          type="button"
                          onClick={() => insertTag('<b>', '</b>')}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTag('<i>', '</i>')}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTag('<h3>', '</h3>')}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Heading"
                        >
                          <Heading2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTag('<ul><li>', '</li></ul>')}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Bullet List"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTag('<blockquote>', '</blockquote>')}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Blockquote"
                        >
                          <Quote className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTag('<code>', '</code>')}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Code"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        ref={textareaRef}
                        rows={7}
                        value={body}
                        onChange={(e) => {
                          setBody(e.target.value);
                          if (errors.body) setErrors({ ...errors, body: '' });
                        }}
                        placeholder="Draft the circular announcement here. HTML tags supported: <b>, <i>, <h3>, <ul>, <li>, <blockquote>..."
                        className="w-full p-3.5 text-xs text-foreground bg-transparent resize-y focus:outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                  ) : (
                    /* Live Preview sanitized with DOMPurify */
                    <div className="min-h-[180px] p-4 rounded-xl border border-border bg-muted/20">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Sanitized HTML Preview (DOMPurify)
                      </div>
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(body || '<p><i>No content drafted yet.</i></p>') }}
                      />
                    </div>
                  )}

                  {errors.body && <p className="text-xs text-rose-500 font-medium">{errors.body}</p>}
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/80">Attachments</span>
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> Attach Document
                    </button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary-600" />
                          <span>{att.name}</span>
                          <span className="text-[10px] text-muted-foreground">({att.sizeKb} KB)</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-muted-foreground hover:text-rose-500 ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="gap-2 shadow-md shadow-primary-500/20"
                  >
                    <Send className="w-4 h-4" /> Broadcast Notice
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* NOTICE HISTORY */
        <Card>
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-primary-500" /> Broadcast History ({notices.length})
            </CardTitle>
            <CardDescription>Archive of issued circulars and their audience delivery scopes</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : error ? (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <p className="text-sm text-foreground font-semibold">{error}</p>
                <Button size="sm" variant="outline" onClick={loadData} className="gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </Button>
              </div>
            ) : notices.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">No circulars broadcasted yet</h4>
                <p className="text-xs text-muted-foreground">
                  Compose and broadcast a notice to see historical transmissions here.
                </p>
                <Button size="sm" onClick={() => setActiveTab('compose')}>
                  Compose First Notice
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="p-4 sm:p-5 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground truncate">{notice.title}</h4>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formatDate(notice.createdAt)}
                        </span>
                      </div>

                      {/* Plain snippet */}
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {notice.body.replace(/<[^>]*>/g, ' ')}
                      </p>

                      {/* Audience Badge */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 uppercase">
                          Scope: {notice.audience}
                          {notice.year ? ` • Year ${notice.year}` : ''}
                          {notice.classId ? ' • Class' : ''}
                        </span>

                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-3 h-3" /> Dispatched
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedNotice(notice)}
                        className="text-xs gap-1.5 h-8"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResendNotice(notice)}
                        className="text-xs gap-1.5 h-8 text-primary-600 dark:text-primary-400"
                        title="Rebroadcast notice to target audience"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Re-send
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Notice Detail Dialog */}
      <Dialog
        isOpen={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || 'Notice Details'}
        description={`Broadcasted on ${selectedNotice ? formatDate(selectedNotice.createdAt) : ''}`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 uppercase">
              Target Audience: {selectedNotice?.audience}
              {selectedNotice?.year ? ` • Year ${selectedNotice.year}` : ''}
            </span>
          </div>

          <div
            className="p-4 rounded-xl border border-border bg-muted/20 prose prose-sm dark:prose-invert max-w-none text-xs text-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(selectedNotice?.body || ''),
            }}
          />

          {selectedNotice?.attachments && selectedNotice.attachments.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground">Attached Files:</span>
              <div className="flex flex-wrap gap-2">
                {selectedNotice.attachments.map((att) => (
                  <span
                    key={att.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs text-foreground font-medium"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary-600" />
                    {att.name} ({att.sizeKb} KB)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setSelectedNotice(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default NoticesPage;
