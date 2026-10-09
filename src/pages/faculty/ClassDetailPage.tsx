import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import {
  classroomService,
  EnrichedClassRoom,
} from '@/api/services/classroom.service';
import { assignmentService } from '@/api/services/assignment.service';
import { submissionService } from '@/api/services/submission.service';
import { attendanceService, ClassAttendanceOverview } from '@/api/services/attendance.service';
import { materialService } from '@/api/services/material.service';
import {
  User,
  StreamPost,
  Assignment,
  Material,
  Attachment,
  GradeOverview,
  AttendanceEntry,
} from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/format';
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  MessageSquare,
  FileText,
  FolderOpen,
  CalendarCheck,
  Award,
  Plus,
  Send,
  Trash2,
  Edit,
  ExternalLink,
  Clock,
  Paperclip,
  CheckCircle2,
  HelpCircle,
  Download,
  AlertCircle,
  Search,
} from 'lucide-react';
import { AudioPlayer } from '@/components/common/AudioPlayer';
import { AudioRecorderButton } from '@/components/common/AudioRecorderButton';

type TabKey = 'stream' | 'assignments' | 'materials' | 'people' | 'attendance' | 'grades';

export const ClassDetailPage: React.FC = () => {
  const { id, classId: paramClassId } = useParams<{ id?: string; classId?: string }>();
  const classId = id || paramClassId || '';

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const [activeTab, setActiveTab] = useState<TabKey>('stream');
  const [cls, setCls] = useState<EnrichedClassRoom | null>(null);
  const [members, setMembers] = useState<{ faculty: User | null; students: User[] }>({
    faculty: null,
    students: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tab 1: Stream state
  const [posts, setPosts] = useState<(StreamPost & { author?: User })[]>([]);
  const [postBody, setPostBody] = useState('');
  const [postType, setPostType] = useState<'ANNOUNCEMENT' | 'MATERIAL' | 'DOUBT'>('ANNOUNCEMENT');
  const [postAttachmentName, setPostAttachmentName] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyAudios, setReplyAudios] = useState<Record<string, { url: string; durationSec: number }>>({});

  // Tab 2: Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignDueAt, setAssignDueAt] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState<number>(25);
  const [assignStatus, setAssignStatus] = useState<'DRAFT' | 'PUBLISHED' | 'CLOSED'>('PUBLISHED');
  const [assignAttachmentName, setAssignAttachmentName] = useState('');
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Tab 3: Materials state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDesc, setMaterialDesc] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');
  const [isMaterialSubmitting, setIsMaterialSubmitting] = useState(false);

  // Tab 4: People state
  const [studentSearch, setStudentSearch] = useState('');

  // Tab 5: Attendance state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceEntries, setAttendanceEntries] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [attendanceOverview, setAttendanceOverview] = useState<ClassAttendanceOverview | null>(null);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Tab 6: Grades state
  const [gradeOverview, setGradeOverview] = useState<GradeOverview[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  // Load classroom basics
  const loadClassroom = async () => {
    if (!classId) return;
    try {
      setIsLoading(true);
      const [classData, membersData] = await Promise.all([
        classroomService.getClassById(classId),
        classroomService.getClassMembers(classId),
      ]);
      setCls(classData);
      setMembers(membersData);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to load classroom details' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassroom();
  }, [classId]);

  // Load tab-specific data when tab changes
  useEffect(() => {
    if (!classId) return;

    if (activeTab === 'stream') {
      classroomService.getClassStream(classId).then(setPosts);
    } else if (activeTab === 'assignments') {
      assignmentService.getClassAssignments(classId, true).then(setAssignments);
    } else if (activeTab === 'materials') {
      materialService.getClassMaterials(classId).then(setMaterials);
    } else if (activeTab === 'attendance') {
      loadAttendanceData();
    } else if (activeTab === 'grades') {
      setIsLoadingGrades(true);
      submissionService.getClassGradeOverview(classId)
        .then(setGradeOverview)
        .finally(() => setIsLoadingGrades(false));
    }
  }, [activeTab, classId]);

  const loadAttendanceData = async () => {
    try {
      const [records, overview] = await Promise.all([
        attendanceService.getClassAttendanceRecords(classId),
        attendanceService.getClassAttendanceOverview(classId),
      ]);
      setAttendanceOverview(overview);

      // Check if attendance exists for selectedDate
      const existing = records.find((r) => r.date === selectedDate);
      const initialMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};

      if (existing) {
        existing.entries.forEach((e) => {
          initialMap[e.studentId] = e.status;
        });
      } else {
        // Default all enrolled students to PRESENT
        members.students.forEach((s) => {
          initialMap[s.id] = 'PRESENT';
        });
      }
      setAttendanceEntries(initialMap);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to load attendance' }));
    }
  };

  // Re-check date change for attendance
  useEffect(() => {
    if (activeTab === 'attendance' && classId) {
      loadAttendanceData();
    }
  }, [selectedDate]);

  const handleCopyCode = () => {
    if (!cls) return;
    navigator.clipboard.writeText(cls.classCode);
    setCopiedCode(true);
    dispatch(addToast({ type: 'info', message: `Copied class code ${cls.classCode}` }));
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // STREAM ACTIONS
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !classId || !postBody.trim()) return;

    try {
      setIsPosting(true);
      const attachments: Attachment[] = postAttachmentName.trim()
        ? [
            {
              id: `att-${Date.now()}`,
              name: postAttachmentName.trim(),
              sizeKb: Math.floor(200 + Math.random() * 1200),
              mime: 'application/pdf',
              url: '#',
            },
          ]
        : [];

      const newPost = await classroomService.createStreamPost(classId, user.id, {
        type: postType,
        body: postBody.trim(),
        attachments,
      });

      setPosts((prev) => [newPost, ...prev]);
      setPostBody('');
      setPostAttachmentName('');
      dispatch(addToast({ type: 'success', message: 'Announcement posted to class stream' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to create post' }));
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddReply = async (postId: string) => {
    const text = replyInputs[postId]?.trim() || '';
    const audioData = replyAudios[postId];
    if (!user || (!text && !audioData)) return;

    try {
      const finalBody = text || '🎤 Audio Explanation';
      const reply = await classroomService.addStreamReply(postId, user.id, finalBody, audioData);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, replies: [...p.replies, reply] } : p))
      );
      setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
      setReplyAudios((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to add reply' }));
    }
  };

  const handleToggleDoubt = async (postId: string) => {
    try {
      const updated = await classroomService.toggleDoubtResolved(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, resolved: updated.resolved } : p))
      );
      dispatch(
        addToast({
          type: 'success',
          message: updated.resolved ? 'Doubt marked as resolved' : 'Doubt reopened',
        })
      );
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update doubt status' }));
    }
  };

  // ASSIGNMENTS ACTIONS
  const handleOpenAssignModal = (assignment?: Assignment) => {
    setAssignError('');
    if (assignment) {
      setEditingAssignment(assignment);
      setAssignTitle(assignment.title);
      setAssignInstructions(assignment.instructions);
      // Format to datetime-local
      const dateStr = assignment.dueAt ? new Date(assignment.dueAt).toISOString().slice(0, 16) : '';
      setAssignDueAt(dateStr);
      setAssignMaxMarks(assignment.maxMarks);
      setAssignStatus(assignment.status || 'PUBLISHED');
      setAssignAttachmentName(assignment.attachments[0]?.name || '');
    } else {
      setEditingAssignment(null);
      setAssignTitle('');
      setAssignInstructions('');
      // Default due 7 days from now at 23:59
      const d = new Date();
      d.setDate(d.getDate() + 7);
      d.setHours(23, 59, 0, 0);
      setAssignDueAt(d.toISOString().slice(0, 16));
      setAssignMaxMarks(25);
      setAssignStatus('PUBLISHED');
      setAssignAttachmentName('');
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;

    if (!assignTitle.trim()) {
      setAssignError('Assignment title is required');
      return;
    }
    if (!assignInstructions.trim()) {
      setAssignError('Instructions/description is required');
      return;
    }
    if (!assignDueAt) {
      setAssignError('Due date and time is required');
      return;
    }
    if (Number(assignMaxMarks) <= 0) {
      setAssignError('Maximum marks must be greater than 0');
      return;
    }

    try {
      setIsAssignSubmitting(true);
      setAssignError('');

      const attachments: Attachment[] = assignAttachmentName.trim()
        ? [
            {
              id: `att-${Date.now()}`,
              name: assignAttachmentName.trim(),
              sizeKb: 450,
              mime: 'application/pdf',
              url: '#',
            },
          ]
        : [];

      if (editingAssignment) {
        const updated = await assignmentService.updateAssignment(editingAssignment.id, {
          title: assignTitle.trim(),
          instructions: assignInstructions.trim(),
          dueAt: new Date(assignDueAt).toISOString(),
          maxMarks: Number(assignMaxMarks),
          status: assignStatus,
          attachments: attachments.length > 0 ? attachments : editingAssignment.attachments,
        });

        setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        dispatch(addToast({ type: 'success', message: 'Assignment updated successfully' }));
      } else {
        const created = await assignmentService.createAssignment(classId, {
          title: assignTitle.trim(),
          instructions: assignInstructions.trim(),
          dueAt: new Date(assignDueAt).toISOString(),
          maxMarks: Number(assignMaxMarks),
          status: assignStatus,
          attachments,
        });

        setAssignments((prev) => [created, ...prev]);
        dispatch(
          addToast({
            type: 'success',
            message: `Assignment "${created.title}" published! Students can now view and submit.`,
          })
        );
      }
      setIsAssignModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save assignment';
      setAssignError(msg);
    } finally {
      setIsAssignSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignId: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment and its submissions?')) return;
    try {
      await assignmentService.deleteAssignment(assignId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignId));
      dispatch(addToast({ type: 'success', message: 'Assignment deleted' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete assignment' }));
    }
  };

  // MATERIALS ACTIONS
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !classId || !materialTitle.trim()) return;

    try {
      setIsMaterialSubmitting(true);
      const attachments: Attachment[] = materialFileName.trim()
        ? [
            {
              id: `att-m-${Date.now()}`,
              name: materialFileName.trim(),
              sizeKb: Math.floor(350 + Math.random() * 2000),
              mime: 'application/pdf',
              url: '#',
            },
          ]
        : [];

      const created = await materialService.createMaterial(classId, user.id, {
        title: materialTitle.trim(),
        description: materialDesc.trim() || undefined,
        attachments,
      });

      setMaterials((prev) => [created, ...prev]);
      setIsMaterialModalOpen(false);
      setMaterialTitle('');
      setMaterialDesc('');
      setMaterialFileName('');
      dispatch(addToast({ type: 'success', message: 'Course material added for students' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to add material' }));
    } finally {
      setIsMaterialSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (matId: string) => {
    try {
      await materialService.deleteMaterial(matId);
      setMaterials((prev) => prev.filter((m) => m.id !== matId));
      dispatch(addToast({ type: 'success', message: 'Material removed' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete material' }));
    }
  };

  // ATTENDANCE ACTIONS
  const handleSaveAttendance = async () => {
    if (!classId) return;
    try {
      setIsSavingAttendance(true);
      const entries: AttendanceEntry[] = members.students.map((s) => ({
        studentId: s.id,
        status: attendanceEntries[s.id] || 'PRESENT',
      }));

      await attendanceService.saveAttendance(classId, selectedDate, entries);
      dispatch(addToast({ type: 'success', message: `Attendance saved for ${selectedDate}!` }));
      loadAttendanceData();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to save attendance' }));
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const updated: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    members.students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceEntries(updated);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-10 w-96 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Classroom Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested classroom does not exist or was removed.</p>
        <Link to="/faculty/classes">
          <Button variant="outline">Back to Classes</Button>
        </Link>
      </div>
    );
  }

  const filteredStudents = members.students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.rollNo && s.rollNo.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/faculty/classes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Classes
        </Link>
      </div>

      {/* Classroom Banner */}
      <div className={`rounded-2xl p-6 sm:p-8 bg-gradient-to-r ${cls.coverColor} text-white shadow-lg relative overflow-hidden`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-sm">
                {cls.course?.code || 'COURSE'}
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-sm">
                Section {cls.section}
              </span>
              <span className="text-xs font-medium text-white/80">
                {cls.course?.title}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">{cls.title}</h1>
            <p className="text-xs sm:text-sm text-white/90">
              Instructor: <span className="font-semibold">{cls.faculty?.name || user?.name}</span> &bull; {cls.studentsCount} Students Enrolled
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center gap-3">
              <div>
                <span className="text-[10px] text-white/70 uppercase font-semibold block tracking-wider">Class Code</span>
                <span className="text-base font-mono font-bold tracking-wider">{cls.classCode}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyCode}
                className="text-white hover:bg-white/20 h-8 px-2.5"
                title="Copy code for student self-enrollment"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Navigation Tabs */}
      <div className="border-b border-border flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px">
        {[
          { key: 'stream', label: 'Stream', icon: MessageSquare },
          { key: 'assignments', label: 'Assignments', icon: FileText, count: assignments.length },
          { key: 'materials', label: 'Materials', icon: FolderOpen, count: materials.length },
          { key: 'people', label: 'People', icon: Users, count: members.students.length },
          { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { key: 'grades', label: 'Grades', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-primary-500/10 text-primary-600' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STREAM */}
      {activeTab === 'stream' && (
        <div className="space-y-6">
          {/* Create Post Box */}
          <Card className="p-5 shadow-sm">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Post to Classroom Stream
                </span>
                <div className="flex gap-1.5">
                  {(['ANNOUNCEMENT', 'MATERIAL', 'DOUBT'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setPostType(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        postType === t
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t === 'ANNOUNCEMENT' ? 'Notice' : t === 'MATERIAL' ? 'Resource' : 'Academic Topic'}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                placeholder="Share an announcement, lecture update, or start an academic discussion..."
                rows={3}
                required
                className="w-full rounded-xl border border-input bg-card p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Attach mock file (e.g. Lecture_Slides.pdf)"
                    value={postAttachmentName}
                    onChange={(e) => setPostAttachmentName(e.target.value)}
                    leftIcon={<Paperclip className="w-3.5 h-3.5 text-muted-foreground" />}
                    className="h-9 text-xs w-full sm:w-72"
                  />
                </div>
                <Button type="submit" isLoading={isPosting} size="sm" className="gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Publish Post
                </Button>
              </div>
            </form>
          </Card>

          {/* Posts Feed */}
          {posts.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">Classroom Stream is Empty</p>
              <p className="text-xs text-muted-foreground">Post the first announcement or syllabus update above.</p>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {post.author?.name ? post.author.name[0] : 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {post.author?.name || 'Class Participant'}
                        </span>
                        <Badge
                          variant={
                            post.type === 'ANNOUNCEMENT'
                              ? 'default'
                              : post.type === 'DOUBT'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {post.type}
                        </Badge>
                        {post.type === 'DOUBT' && (
                          <span
                            className={`text-[11px] font-semibold flex items-center gap-1 ${
                              post.resolved ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {post.resolved ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <HelpCircle className="w-3.5 h-3.5" />
                            )}
                            {post.resolved ? 'Resolved' : 'Needs Resolution'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(post.createdAt, 'MMM d, yyyy &bull; h:mm a')}
                      </p>
                    </div>
                  </div>

                  {post.type === 'DOUBT' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleDoubt(post.id)}
                        className="text-xs"
                      >
                        {post.resolved ? 'Reopen Doubt' : 'Mark Resolved'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-13">
                  {post.body}
                </div>

                {/* Audio Doubt Player */}
                {post.audioUrl && (
                  <div className="pl-13 pt-1">
                    <AudioPlayer
                      src={post.audioUrl}
                      title="Student Voice Doubt"
                      duration={post.audioDurationSec}
                    />
                  </div>
                )}

                {/* Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="pl-13 flex flex-wrap gap-2 pt-1">
                    {post.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                        onClick={() =>
                          dispatch(addToast({ type: 'info', message: `Simulated download of ${att.name}` }))
                        }
                      >
                        <Paperclip className="w-3.5 h-3.5 text-primary-500" />
                        <span>{att.name}</span>
                        <span className="text-[10px] text-muted-foreground">({att.sizeKb} KB)</span>
                        <Download className="w-3 h-3 text-muted-foreground ml-1" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Replies Thread */}
                <div className="pl-13 pt-3 border-t border-border space-y-3">
                  {post.replies.map((reply) => {
                    const replyAuthor = members.students.find((s) => s.id === reply.authorId) ||
                      (cls.facultyId === reply.authorId ? cls.faculty : null);
                    return (
                      <div key={reply.id} className="p-3 rounded-xl bg-muted/30 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {replyAuthor?.name || 'Classroom User'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(reply.createdAt, 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-foreground/80">{reply.body}</p>

                        {/* Audio Reply Player */}
                        {reply.audioUrl && (
                          <div className="pt-1.5">
                            <AudioPlayer
                              src={reply.audioUrl}
                              title="Voice Explanation"
                              duration={reply.audioDurationSec}
                              compact
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Reply Bar */}
                  <div className="space-y-2 pt-1">
                    {replyAudios[post.id] && (
                      <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border">
                        <AudioPlayer
                          src={replyAudios[post.id].url}
                          title="Voice Explanation Preview"
                          duration={replyAudios[post.id].durationSec}
                          compact
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setReplyAudios((prev) => {
                              const n = { ...prev };
                              delete n[post.id];
                              return n;
                            })
                          }
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Write an instructor reply or record audio..."
                        value={replyInputs[post.id] || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddReply(post.id);
                          }
                        }}
                        className="h-9 text-xs"
                      />

                      <AudioRecorderButton
                        compact
                        onAudioRecorded={(res) =>
                          setReplyAudios((prev) => ({ ...prev, [post.id]: res }))
                        }
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddReply(post.id)}
                        className="h-9 text-xs px-3"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Course Assignments & Labs</h3>
              <p className="text-xs text-muted-foreground">
                Create assignments, define grading rubrics, inspect student submissions, and award marks
              </p>
            </div>
            <Button onClick={() => handleOpenAssignModal()} className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Create Assignment
            </Button>
          </div>

          {assignments.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No Assignments Created Yet</p>
              <p className="text-xs text-muted-foreground">
                Create your first lab or assignment with due dates and attachments.
              </p>
              <Button size="sm" onClick={() => handleOpenAssignModal()} className="mt-3">
                <Plus className="w-4 h-4 mr-1.5" /> Create Assignment
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((assign) => {
                const isOverdue = new Date() > new Date(assign.dueAt);
                return (
                  <Card key={assign.id} className="p-5 hover:border-primary-500/40 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-foreground">{assign.title}</h4>
                          <Badge
                            variant={
                              assign.status === 'PUBLISHED'
                                ? 'success'
                                : assign.status === 'DRAFT'
                                ? 'secondary'
                                : 'warning'
                            }
                          >
                            {assign.status || 'PUBLISHED'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{assign.instructions}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                          <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-500' : ''}`}>
                            <Clock className="w-3.5 h-3.5" /> Due: {formatDate(assign.dueAt, 'MMM d, yyyy h:mm a')}
                          </span>
                          <span className="font-semibold text-foreground">Max Marks: {assign.maxMarks}</span>
                          {assign.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-primary-600">
                              <Paperclip className="w-3.5 h-3.5" /> {assign.attachments.length} Attached file
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link to={`/faculty/assignments/${assign.id}/submissions`}>
                          <Button size="sm" className="gap-1.5 text-xs">
                            <span>Submissions</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAssignModal(assign)}
                          className="h-8 px-2.5 text-xs"
                          title="Edit Assignment"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAssignment(assign.id)}
                          className="h-8 px-2.5 text-rose-600 hover:bg-rose-500/10"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Create/Edit Assignment Modal */}
          <Dialog
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            title={editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
            description="Set instructions, due dates, maximum marks, and upload reference specifications."
          >
            <form onSubmit={handleSaveAssignment} className="space-y-4 pt-2">
              {assignError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                  {assignError}
                </div>
              )}

              <Input
                label="Assignment Title"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder="e.g. Lab 3: Redux State Management"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground/80">Instructions & Problem Statement</label>
                <textarea
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="Describe problem statement, test cases, and lab deliverables..."
                  rows={4}
                  required
                  className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Due Date & Time"
                  type="datetime-local"
                  value={assignDueAt}
                  onChange={(e) => setAssignDueAt(e.target.value)}
                  required
                />
                <Input
                  label="Maximum Marks"
                  type="number"
                  min="1"
                  max="1000"
                  value={assignMaxMarks}
                  onChange={(e) => setAssignMaxMarks(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground/80">Publish Status</label>
                <div className="flex gap-2">
                  {(['PUBLISHED', 'DRAFT', 'CLOSED'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setAssignStatus(st)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        assignStatus === st
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Instructor Attachment (Mock File)"
                value={assignAttachmentName}
                onChange={(e) => setAssignAttachmentName(e.target.value)}
                placeholder="e.g. Lab3_Rubric_and_Starter.pdf"
                leftIcon={<Paperclip className="w-4 h-4 text-muted-foreground" />}
                helperText="Simulated reference document attachment for students"
              />

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={isAssignSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isAssignSubmitting}>
                  {editingAssignment ? 'Save Changes' : 'Publish Assignment'}
                </Button>
              </div>
            </form>
          </Dialog>
        </div>
      )}

      {/* TAB 3: MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Course Study Materials</h3>
              <p className="text-xs text-muted-foreground">
                Upload lecture slides, notes, reference cheat sheets, and curriculum documents
              </p>
            </div>
            <Button onClick={() => setIsMaterialModalOpen(true)} className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Add Material
            </Button>
          </div>

          {materials.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No Materials Uploaded</p>
              <p className="text-xs text-muted-foreground">
                Upload lecture slides or reference sheets for your students.
              </p>
              <Button size="sm" onClick={() => setIsMaterialModalOpen(true)} className="mt-3">
                <Plus className="w-4 h-4 mr-1.5" /> Add Material
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((mat) => (
                <Card key={mat.id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-sm text-foreground">{mat.title}</h4>
                      </div>
                      <button
                        onClick={() => handleDeleteMaterial(mat.id)}
                        className="text-muted-foreground hover:text-rose-600 transition-colors p-1"
                        title="Delete Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {mat.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{mat.description}</p>
                    )}

                    <p className="text-[11px] text-muted-foreground">
                      Uploaded {formatDate(mat.uploadedAt, 'MMM d, yyyy')}
                    </p>
                  </div>

                  {mat.attachments.length > 0 && (
                    <div className="pt-2 border-t border-border flex flex-wrap gap-2">
                      {mat.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between w-full p-2.5 rounded-xl bg-muted/40 border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                          onClick={() =>
                            dispatch(addToast({ type: 'info', message: `Simulated download of ${att.name}` }))
                          }
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                            <span className="truncate">{att.name}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">{att.sizeKb} KB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Add Material Modal */}
          <Dialog
            isOpen={isMaterialModalOpen}
            onClose={() => setIsMaterialModalOpen(false)}
            title="Add Course Material"
            description="Upload educational resources and study documents for enrolled students."
          >
            <form onSubmit={handleSaveMaterial} className="space-y-4 pt-2">
              <Input
                label="Material Title"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                placeholder="e.g. Unit 3: Database Indexing & B-Trees"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground/80">Description / Topic Summary</label>
                <textarea
                  value={materialDesc}
                  onChange={(e) => setMaterialDesc(e.target.value)}
                  placeholder="Outline key topics and chapters covered in this resource..."
                  rows={3}
                  className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <Input
                label="File Attachment (Mock File Name)"
                value={materialFileName}
                onChange={(e) => setMaterialFileName(e.target.value)}
                placeholder="e.g. Unit3_Indexing_Notes.pdf"
                leftIcon={<Paperclip className="w-4 h-4 text-muted-foreground" />}
                helperText="Simulated reference document upload"
              />

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMaterialModalOpen(false)}
                  disabled={isMaterialSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isMaterialSubmitting}>
                  Upload Material
                </Button>
              </div>
            </form>
          </Dialog>
        </div>
      )}

      {/* TAB 4: PEOPLE */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          {/* Instructor Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Class Instructor</h3>
            <Card className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold text-base">
                  {cls.faculty?.name ? cls.faculty.name[0] : 'F'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{cls.faculty?.name || user?.name}</h4>
                  <p className="text-xs text-muted-foreground">{cls.faculty?.email || user?.email}</p>
                </div>
              </div>
              <Badge variant="default">Faculty Head</Badge>
            </Card>
          </div>

          {/* Enrolled Students Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Enrolled Students ({members.students.length})
                </h3>
                <p className="text-xs text-muted-foreground">Verified student roster for Section {cls.section}</p>
              </div>
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Filter student name or roll..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <Card className="p-8 text-center text-xs text-muted-foreground">
                No students match your filter or class has no enrollments yet.
              </Card>
            ) : (
              <Card className="overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5">Roll No</th>
                        <th className="p-3.5">Academic Email</th>
                        <th className="p-3.5">Year / Division</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredStudents.map((stu) => (
                        <tr key={stu.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5 font-semibold text-foreground flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {stu.name[0]}
                            </div>
                            <span>{stu.name}</span>
                          </td>
                          <td className="p-3.5 font-mono text-muted-foreground">{stu.rollNo || 'N/A'}</td>
                          <td className="p-3.5 text-muted-foreground">{stu.email}</td>
                          <td className="p-3.5 text-muted-foreground">
                            Year {stu.year || 3} (Div {stu.division || cls.section})
                          </td>
                          <td className="p-3.5 text-right text-xs text-muted-foreground">
                            Enrolled
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Class Attendance Register</h3>
              <p className="text-xs text-muted-foreground">
                Record daily attendance, evaluate percentage benchmarks, and track historical participation
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 text-xs w-40"
              />
              <Button
                onClick={handleSaveAttendance}
                isLoading={isSavingAttendance}
                size="sm"
                className="gap-1.5 shadow-sm"
              >
                <CalendarCheck className="w-4 h-4" /> Save Attendance
              </Button>
            </div>
          </div>

          {/* Quick Stats Overview */}
          {attendanceOverview && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Total Sessions Held</span>
                    <p className="text-2xl font-extrabold text-foreground">{attendanceOverview.totalSessions}</p>
                  </div>
                  <CalendarCheck className="w-5 h-5 text-primary-500" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Class Average Attendance</span>
                    <p className="text-2xl font-extrabold text-foreground">{attendanceOverview.averagePercentage}%</p>
                  </div>
                  <Award className="w-5 h-5 text-emerald-500" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Students in Roster</span>
                    <p className="text-2xl font-extrabold text-foreground">{members.students.length}</p>
                  </div>
                  <Users className="w-5 h-5 text-teal-500" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Attendance Marking Table */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-foreground">Marking for {selectedDate}</h4>
                <p className="text-xs text-muted-foreground">Select Present, Absent, or Late for each enrolled student</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                >
                  Mark All Present
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAll('ABSENT')}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                >
                  Mark All Absent
                </Button>
              </div>
            </div>

            {members.students.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">No enrolled students to mark.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Attendance Status</th>
                      <th className="p-3">Cumulative Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.students.map((student) => {
                      const currentStatus = attendanceEntries[student.id] || 'PRESENT';
                      const summary = attendanceOverview?.studentSummaries.find(
                        (s) => s.studentId === student.id
                      );
                      return (
                        <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">{student.name}</td>
                          <td className="p-3 font-mono text-muted-foreground">{student.rollNo || '-'}</td>
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              {(['PRESENT', 'ABSENT', 'LATE'] as const).map((st) => (
                                <button
                                  type="button"
                                  key={st}
                                  onClick={() =>
                                    setAttendanceEntries((prev) => ({ ...prev, [student.id]: st }))
                                  }
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    currentStatus === st
                                      ? st === 'PRESENT'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : st === 'ABSENT'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'bg-amber-600 text-white shadow-sm'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                                (summary?.percentage ?? 100) >= 75
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-rose-500/10 text-rose-600'
                              }`}
                            >
                              {summary?.percentage ?? 100}% ({summary?.presentCount ?? 0}/{summary?.totalSessions ?? 0})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 6: GRADES */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Classroom Grade Matrix</h3>
            <p className="text-xs text-muted-foreground">
              Comprehensive student evaluation scores across all published assignments
            </p>
          </div>

          {isLoadingGrades ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : gradeOverview.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Award className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No Grade Data Available</p>
              <p className="text-xs text-muted-foreground">
                Publish assignments and grade submissions to view class analytics.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Roll No</th>
                      {assignments
                        .filter((a) => a.status !== 'DRAFT')
                        .map((a) => (
                          <th key={a.id} className="p-3.5 whitespace-nowrap">
                            {a.title}
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              Max: {a.maxMarks}
                            </span>
                          </th>
                        ))}
                      <th className="p-3.5 whitespace-nowrap">Total Earned</th>
                      <th className="p-3.5 whitespace-nowrap">Overall Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {gradeOverview.map((item) => (
                      <tr key={item.studentId} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 font-semibold text-foreground">{item.studentName}</td>
                        <td className="p-3.5 font-mono text-muted-foreground">{item.rollNo || '-'}</td>
                        {item.grades.map((g) => (
                          <td key={g.assignmentId} className="p-3.5 whitespace-nowrap">
                            {g.status === 'GRADED' && typeof g.marks === 'number' ? (
                              <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                                {g.marks} / {g.maxMarks}
                              </span>
                            ) : g.status === 'SUBMITTED' || g.status === 'LATE' ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold text-[11px]">
                                Submitted (Pending)
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60 italic">Pending</span>
                            )}
                          </td>
                        ))}
                        <td className="p-3.5 font-bold text-foreground">
                          {item.totalMarksEarned} / {item.totalPossibleMarks}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                              item.percentage >= 75
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : item.percentage >= 50
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-rose-500/10 text-rose-600'
                            }`}
                          >
                            {item.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassDetailPage;
