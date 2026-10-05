import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { classroomService, EnrichedClassRoom } from '@/api/services/classroom.service';
import { assignmentService } from '@/api/services/assignment.service';
import { submissionService } from '@/api/services/submission.service';
import { attendanceService, StudentAttendanceSummary } from '@/api/services/attendance.service';
import { materialService } from '@/api/services/material.service';
import {
  User,
  StreamPost,
  Assignment,
  Material,
  SubmissionStatus,
  StudentGradeItem,
} from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/format';
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  FileText,
  Users,
  Award,
  CalendarCheck,
  Clock,
  Paperclip,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  FolderOpen,
} from 'lucide-react';

type StudentTabKey = 'stream' | 'classwork' | 'people' | 'grades' | 'attendance';

interface EnrichedStudentAssignment extends Assignment {
  submissionStatus: SubmissionStatus;
  marks?: number;
  submittedAt?: string;
  feedback?: string;
}

export const StudentClassDetailPage: React.FC = () => {
  const { id, classId: paramClassId } = useParams<{ id?: string; classId?: string }>();
  const classId = id || paramClassId || '';

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const [activeTab, setActiveTab] = useState<StudentTabKey>('stream');
  const [cls, setCls] = useState<EnrichedClassRoom | null>(null);
  const [members, setMembers] = useState<{ faculty: User | null; students: User[] }>({
    faculty: null,
    students: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Tab 1: Stream state
  const [posts, setPosts] = useState<(StreamPost & { author?: User })[]>([]);
  const [doubtText, setDoubtText] = useState('');
  const [isAskingDoubt, setIsAskingDoubt] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Tab 2: Classwork state
  const [assignments, setAssignments] = useState<EnrichedStudentAssignment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Tab 4: Grades state
  const [gradeItems, setGradeItems] = useState<(StudentGradeItem & { feedback?: string })[]>([]);
  const [totalMarksEarned, setTotalMarksEarned] = useState(0);
  const [totalPossibleMarks, setTotalPossibleMarks] = useState(0);
  const [gradePercentage, setGradePercentage] = useState(0);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  // Tab 5: Attendance state
  const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummary | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

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

  // Load tab-specific data
  useEffect(() => {
    if (!classId || !user) return;

    if (activeTab === 'stream') {
      classroomService.getClassStream(classId).then(setPosts);
    } else if (activeTab === 'classwork') {
      Promise.all([
        assignmentService.getClassAssignments(classId, false),
        materialService.getClassMaterials(classId),
      ]).then(async ([assignList, matList]) => {
        setMaterials(matList);

        // Fetch student's submission status for each assignment
        const enriched: EnrichedStudentAssignment[] = await Promise.all(
          assignList.map(async (a) => {
            const sub = await submissionService.getStudentSubmission(a.id, user.id);
            return {
              ...a,
              submissionStatus: sub?.status || 'PENDING',
              marks: sub?.marks,
              submittedAt: sub?.submittedAt,
              feedback: sub?.feedback,
            };
          })
        );
        setAssignments(enriched);
      });
    } else if (activeTab === 'grades') {
      setIsLoadingGrades(true);
      submissionService.getStudentGradesForClass(classId, user.id)
        .then((res) => {
          setGradeItems(res.items);
          setTotalMarksEarned(res.totalMarksEarned);
          setTotalPossibleMarks(res.totalPossibleMarks);
          setGradePercentage(res.percentage);
        })
        .finally(() => setIsLoadingGrades(false));
    } else if (activeTab === 'attendance') {
      setIsLoadingAttendance(true);
      attendanceService.getStudentAttendance(classId, user.id)
        .then(setAttendanceSummary)
        .finally(() => setIsLoadingAttendance(false));
    }
  }, [activeTab, classId, user]);

  // STREAM: Ask Doubt
  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !classId || !doubtText.trim()) return;

    try {
      setIsAskingDoubt(true);
      const newPost = await classroomService.createStreamPost(classId, user.id, {
        type: 'DOUBT',
        body: doubtText.trim(),
      });

      setPosts((prev) => [newPost, ...prev]);
      setDoubtText('');
      dispatch(addToast({ type: 'success', message: 'Question posted to classroom stream' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to post question' }));
    } finally {
      setIsAskingDoubt(false);
    }
  };

  // STREAM: Reply
  const handleAddReply = async (postId: string) => {
    const text = replyInputs[postId]?.trim();
    if (!user || !text) return;

    try {
      const reply = await classroomService.addStreamReply(postId, user.id, text);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, replies: [...p.replies, reply] } : p))
      );
      setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to post reply' }));
    }
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
        <p className="text-sm text-muted-foreground">The requested class could not be loaded.</p>
        <Link to="/student/classes">
          <Button variant="outline">Back to Classes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/student/classes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Enrolled Classes
        </Link>
      </div>

      {/* Classroom Header Banner */}
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
            <p className="text-xs sm:text-sm text-white/90 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              Instructor: <span className="font-semibold">{cls.faculty?.name || 'Faculty Professor'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10 text-right">
              <span className="text-[10px] text-white/70 uppercase font-semibold block tracking-wider">Classmates</span>
              <span className="text-lg font-bold">{cls.studentsCount} Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Navigation Tabs */}
      <div className="border-b border-border flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px">
        {[
          { key: 'stream', label: 'Stream', icon: MessageSquare },
          { key: 'classwork', label: 'Classwork', icon: FileText, count: assignments.length },
          { key: 'people', label: 'People', icon: Users, count: members.students.length },
          { key: 'grades', label: 'My Grades', icon: Award },
          { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as StudentTabKey)}
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
          {/* Student Ask Question Card */}
          <Card className="p-5 shadow-sm">
            <form onSubmit={handleAskDoubt} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-primary-500" />
                  Ask an Academic Question or Doubt
                </span>
                <span className="text-[11px] text-muted-foreground">Visible to instructor & classmates</span>
              </div>

              <textarea
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
                placeholder="Ask about assignment requirements, lecture doubts, or concept clarifications..."
                rows={2}
                required
                className="w-full rounded-xl border border-input bg-card p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />

              <div className="flex justify-end pt-1">
                <Button type="submit" isLoading={isAskingDoubt} size="sm" className="gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Post Question
                </Button>
              </div>
            </form>
          </Card>

          {/* Posts Feed */}
          {posts.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No Announcements Yet</p>
              <p className="text-xs text-muted-foreground">
                Your instructor has not posted any updates to the stream yet.
              </p>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {post.author?.name ? post.author.name[0] : 'U'}
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
                            {post.resolved ? 'Resolved' : 'Open'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(post.createdAt, 'MMM d, yyyy &bull; h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-13">
                  {post.body}
                </div>

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
                    const isInstructor = reply.authorId === cls.facultyId;
                    return (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-xl text-xs space-y-1 ${
                          isInstructor
                            ? 'bg-primary-500/10 border border-primary-500/20'
                            : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${isInstructor ? 'text-primary-700 dark:text-primary-300' : 'text-foreground'}`}>
                            {replyAuthor?.name || 'Class Participant'} {isInstructor && '(Instructor)'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(reply.createdAt, 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-foreground/80">{reply.body}</p>
                      </div>
                    );
                  })}

                  {/* Add Reply */}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Write a comment..."
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
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CLASSWORK */}
      {activeTab === 'classwork' && (
        <div className="space-y-8">
          {/* Assignments Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Assignments & Lab Work</h3>
              <p className="text-xs text-muted-foreground">
                Select an assignment to view problem descriptions, rubrics, and upload your lab solutions
              </p>
            </div>

            {assignments.length === 0 ? (
              <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
                No assignments have been assigned yet.
              </Card>
            ) : (
              <div className="space-y-3">
                {assignments.map((assign) => {
                  const isSubmitted =
                    assign.submissionStatus === 'SUBMITTED' ||
                    assign.submissionStatus === 'LATE' ||
                    assign.submissionStatus === 'GRADED';

                  return (
                    <Card
                      key={assign.id}
                      className="p-5 hover:border-primary-500/40 transition-all hover:shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-base text-foreground">{assign.title}</h4>
                            <Badge
                              variant={
                                assign.submissionStatus === 'GRADED'
                                  ? 'success'
                                  : assign.submissionStatus === 'SUBMITTED'
                                  ? 'info'
                                  : assign.submissionStatus === 'LATE'
                                  ? 'warning'
                                  : 'secondary'
                              }
                            >
                              {assign.submissionStatus}
                            </Badge>
                            {assign.status === 'CLOSED' && (
                              <Badge variant="danger">Closed</Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">{assign.instructions}</p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5 text-amber-500" /> Due: {formatDate(assign.dueAt, 'MMM d, yyyy h:mm a')}
                            </span>
                            <span className="font-semibold text-foreground">Max Marks: {assign.maxMarks}</span>
                            {assign.submissionStatus === 'GRADED' && typeof assign.marks === 'number' && (
                              <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                Score: {assign.marks} / {assign.maxMarks}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Link to={`/student/assignments/${assign.id}`}>
                            <Button
                              size="sm"
                              variant={isSubmitted ? 'outline' : 'primary'}
                              className="text-xs gap-1.5"
                            >
                              <span>{isSubmitted ? 'View Submission' : 'Submit Work'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Study Materials Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <h3 className="text-lg font-bold text-foreground">Course Study Resources</h3>
              <p className="text-xs text-muted-foreground">
                Lecture notes, cheat sheets, and references provided by your instructor
              </p>
            </div>

            {materials.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No study materials uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map((mat) => (
                  <Card key={mat.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{mat.title}</h4>
                        <p className="text-[11px] text-muted-foreground">Uploaded {formatDate(mat.uploadedAt, 'MMM d, yyyy')}</p>
                      </div>
                    </div>

                    {mat.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{mat.description}</p>
                    )}

                    {mat.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border text-xs text-foreground cursor-pointer hover:bg-muted transition-colors"
                        onClick={() =>
                          dispatch(addToast({ type: 'info', message: `Simulated download of ${att.name}` }))
                        }
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </div>
                        <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PEOPLE */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          {/* Instructor Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Course Teacher</h3>
            <Card className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold text-base">
                  {cls.faculty?.name ? cls.faculty.name[0] : 'T'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{cls.faculty?.name || 'Faculty Professor'}</h4>
                  <p className="text-xs text-muted-foreground">{cls.faculty?.email || 'faculty@campus.test'}</p>
                </div>
              </div>
              <Badge variant="default">Instructor</Badge>
            </Card>
          </div>

          {/* Enrolled Classmates */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Classmates ({members.students.length})
            </h3>
            <Card className="overflow-hidden border border-border">
              <div className="divide-y divide-border">
                {members.students.map((stu) => {
                  const isSelf = stu.id === user?.id;
                  return (
                    <div
                      key={stu.id}
                      className={`p-3.5 flex items-center justify-between transition-colors ${
                        isSelf ? 'bg-primary-500/5 font-semibold' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                          {stu.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {stu.name} {isSelf && <span className="text-primary-600 font-bold">(You)</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Roll: {stu.rollNo || '-'} &bull; Year {stu.year || 3} (Div {stu.division || cls.section})
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: MY GRADES */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">My Performance & Marks</h3>
            <p className="text-xs text-muted-foreground">
              Official scores and instructor feedback for your submitted course work
            </p>
          </div>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Total Marks Earned</span>
                  <p className="text-2xl font-extrabold text-foreground">{totalMarksEarned} / {totalPossibleMarks}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Award className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Grade Average</span>
                  <p className="text-2xl font-extrabold text-foreground">{gradePercentage}%</p>
                </div>
                <div className="p-3 rounded-xl bg-primary-500/10 text-primary-600">
                  <FileText className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Graded Deliverables</span>
                  <p className="text-2xl font-extrabold text-foreground">
                    {gradeItems.filter((g) => g.status === 'GRADED').length} / {gradeItems.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grades Table */}
          {isLoadingGrades ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : gradeItems.length === 0 ? (
            <Card className="p-10 text-center border-dashed text-xs text-muted-foreground">
              No assignments available in this course yet.
            </Card>
          ) : (
            <Card className="overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Assignment</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Marks Awarded</th>
                      <th className="p-3.5">Percentage</th>
                      <th className="p-3.5">Instructor Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {gradeItems.map((item) => {
                      const itemPercentage =
                        typeof item.marks === 'number'
                          ? Math.round((item.marks / item.maxMarks) * 100)
                          : null;

                      return (
                        <tr key={item.assignmentId} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 font-semibold text-foreground">
                            <Link
                              to={`/student/assignments/${item.assignmentId}`}
                              className="hover:text-primary-600 hover:underline flex items-center gap-1.5"
                            >
                              <span>{item.assignmentTitle}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            </Link>
                          </td>
                          <td className="p-3.5">
                            <Badge
                              variant={
                                item.status === 'GRADED'
                                  ? 'success'
                                  : item.status === 'SUBMITTED'
                                  ? 'info'
                                  : item.status === 'LATE'
                                  ? 'warning'
                                  : 'secondary'
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-3.5 font-bold">
                            {typeof item.marks === 'number' ? (
                              <span className="text-emerald-600">
                                {item.marks} / {item.maxMarks}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-normal italic">
                                {item.status === 'SUBMITTED' ? 'Awaiting grading' : 'Not submitted'}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-semibold">
                            {itemPercentage !== null ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  itemPercentage >= 75
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : itemPercentage >= 50
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-rose-500/10 text-rose-600'
                                }`}
                              >
                                {itemPercentage}%
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3.5">
                            {item.feedback ? (
                              <div className="p-2 rounded-lg bg-muted/40 border border-border text-xs italic text-foreground/90">
                                &ldquo;{item.feedback}&rdquo;
                              </div>
                            ) : (
                              <span className="text-muted-foreground/60 italic">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 5: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Attendance Record</h3>
            <p className="text-xs text-muted-foreground">
              Official attendance logs saved by your instructor for Section {cls.section}
            </p>
          </div>

          {isLoadingAttendance ? (
            <Skeleton className="h-44 w-full rounded-2xl" />
          ) : attendanceSummary ? (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Attendance Rate</span>
                      <p className="text-2xl font-extrabold text-foreground">{attendanceSummary.percentage}%</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-600">
                      <Award className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Total Sessions</span>
                      <p className="text-2xl font-extrabold text-foreground">{attendanceSummary.totalSessions}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Attended (Present)</span>
                      <p className="text-2xl font-extrabold text-emerald-600">{attendanceSummary.presentCount}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Absences</span>
                      <p className="text-2xl font-extrabold text-rose-600">{attendanceSummary.absentCount}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  attendanceSummary.percentage >= 75
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
                  {attendanceSummary.percentage >= 75 ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  )}
                  <span>
                    {attendanceSummary.percentage >= 75
                      ? 'Attendance is in Good Standing (above 75% institute threshold).'
                      : 'Attendance Warning: Below 75% institute eligibility benchmark.'}
                  </span>
                </div>
                <Badge variant={attendanceSummary.percentage >= 75 ? 'success' : 'danger'}>
                  {attendanceSummary.percentage}% Overall
                </Badge>
              </div>

              {/* Date-by-date Session History Table */}
              <Card className="overflow-hidden border border-border">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Session Log</h4>
                </div>
                {attendanceSummary.history.length === 0 ? (
                  <p className="p-6 text-center text-xs text-muted-foreground">No sessions marked yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {attendanceSummary.history.map((record, index) => (
                      <div key={index} className="p-3.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {formatDate(record.date, 'EEEE, MMMM d, yyyy')}
                        </span>
                        <Badge
                          variant={
                            record.status === 'PRESENT'
                              ? 'success'
                              : record.status === 'LATE'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default StudentClassDetailPage;
