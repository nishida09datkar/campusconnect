import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/features/ui/uiSlice';
import { assignmentService } from '@/api/services/assignment.service';
import { submissionService, EnrichedSubmission } from '@/api/services/submission.service';
import { classroomService, EnrichedClassRoom } from '@/api/services/classroom.service';
import { Assignment } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/format';
import {
  ArrowLeft,
  Clock,
  Award,
  Users,
  AlertTriangle,
  Paperclip,
  Download,
  Edit3,
  FileText,
  Search,
  Filter,
} from 'lucide-react';

export const SubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const assignmentId = id || '';

  const dispatch = useAppDispatch();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [classroom, setClassroom] = useState<EnrichedClassRoom | null>(null);
  const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED'>('ALL');

  // Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<EnrichedSubmission | null>(null);
  const [marksInput, setMarksInput] = useState<number | string>('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isGradingSubmitting, setIsGradingSubmitting] = useState(false);
  const [gradeError, setGradeError] = useState('');

  const loadData = useCallback(async () => {
    if (!assignmentId) return;
    try {
      setIsLoading(true);
      const assign = await assignmentService.getAssignmentById(assignmentId);
      if (!assign) throw new Error('Assignment not found');
      setAssignment(assign);

      const [cls, subs] = await Promise.all([
        classroomService.getClassById(assign.classId),
        submissionService.getSubmissionsByAssignment(assignmentId),
      ]);

      setClassroom(cls);
      setSubmissions(subs);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to load assignment submissions' }));
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        s.student.name.toLowerCase().includes(q) ||
        (s.student.rollNo && s.student.rollNo.toLowerCase().includes(q));

      if (!matchesQuery) return false;
      if (statusFilter === 'ALL') return true;
      return s.status === statusFilter;
    });
  }, [submissions, searchQuery, statusFilter]);

  const handleOpenGradeModal = (sub: EnrichedSubmission) => {
    setGradingSubmission(sub);
    setMarksInput(typeof sub.marks === 'number' ? sub.marks : assignment?.maxMarks || 25);
    setFeedbackInput(sub.feedback || '');
    setGradeError('');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !assignment) return;

    const marks = Number(marksInput);
    if (isNaN(marks) || marks < 0) {
      setGradeError('Marks must be 0 or higher');
      return;
    }
    if (marks > assignment.maxMarks) {
      setGradeError(`Marks cannot exceed maximum of ${assignment.maxMarks}`);
      return;
    }

    try {
      setIsGradingSubmitting(true);
      setGradeError('');

      const updated = await submissionService.gradeSubmission(gradingSubmission.id, {
        marks,
        feedback: feedbackInput.trim() || undefined,
      });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === gradingSubmission.id || (s.studentId === gradingSubmission.studentId && s.assignmentId === assignmentId)
            ? {
                ...s,
                id: updated.id,
                status: 'GRADED',
                marks: updated.marks,
                feedback: updated.feedback,
              }
            : s
        )
      );

      dispatch(
        addToast({
          type: 'success',
          message: `Grade awarded to ${gradingSubmission.student.name}: ${marks}/${assignment.maxMarks}`,
        })
      );
      setGradingSubmission(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save grade';
      setGradeError(msg);
    } finally {
      setIsGradingSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">Assignment Not Found</h2>
        <Link to="/faculty/classes">
          <Button variant="outline">Back to Classes</Button>
        </Link>
      </div>
    );
  }

  const isOverdue = new Date() > new Date(assignment.dueAt);

  const totalEnrolled = submissions.length;
  const submittedCount = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'LATE').length;
  const gradedCount = submissions.filter((s) => s.status === 'GRADED').length;
  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={`/faculty/classes/${assignment.classId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {classroom?.title || 'Classroom'}
        </Link>
      </div>

      <PageHeader
        title={`Submissions: ${assignment.title}`}
        description={`${classroom?.course?.code || 'COURSE'} &bull; Section ${classroom?.section || 'A'} &bull; Max Marks: ${assignment.maxMarks}`}
        actions={
          <Badge
            variant={
              assignment.status === 'PUBLISHED'
                ? 'success'
                : assignment.status === 'DRAFT'
                ? 'secondary'
                : 'warning'
            }
            className="text-xs px-3 py-1 uppercase font-bold"
          >
            {assignment.status || 'PUBLISHED'}
          </Badge>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase">Total Enrolled</span>
              <p className="text-2xl font-extrabold text-foreground">{totalEnrolled}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary-500/10 text-primary-600">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase">Need Grading</span>
              <p className="text-2xl font-extrabold text-foreground">{submittedCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase">Evaluated & Graded</span>
              <p className="text-2xl font-extrabold text-foreground">{gradedCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-semibold uppercase">Pending Submission</span>
              <p className="text-2xl font-extrabold text-foreground">{pendingCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Summary Box */}
      <Card className="p-5 space-y-3 bg-muted/20 border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-500" />
            <h4 className="font-bold text-sm text-foreground">Instructions & Rubric</h4>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-500' : ''}`}>
              <Clock className="w-3.5 h-3.5" /> Due: {formatDate(assignment.dueAt, 'MMM d, yyyy h:mm a')}
            </span>
            <span>Max Score: <strong>{assignment.maxMarks}</strong></span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {assignment.instructions}
        </p>
      </Card>

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search student by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(['ALL', 'SUBMITTED', 'GRADED', 'LATE', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <Card className="overflow-hidden border border-border">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No student submissions match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Roll No</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Submitted At</th>
                  <th className="p-3.5">Attached Files</th>
                  <th className="p-3.5">Marks</th>
                  <th className="p-3.5">Feedback</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubmissions.map((sub) => {
                  return (
                    <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 font-semibold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {sub.student.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{sub.student.name}</p>
                            <p className="text-[10px] text-muted-foreground font-normal">{sub.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">{sub.student.rollNo || '-'}</td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            sub.status === 'GRADED'
                              ? 'success'
                              : sub.status === 'SUBMITTED'
                              ? 'info'
                              : sub.status === 'LATE'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {sub.submittedAt ? formatDate(sub.submittedAt, 'MMM d, h:mm a') : '-'}
                      </td>
                      <td className="p-3.5">
                        {sub.files && sub.files.length > 0 ? (
                          <div className="space-y-1">
                            {sub.files.map((f) => (
                              <button
                                key={f.id}
                                onClick={() =>
                                  dispatch(addToast({ type: 'info', message: `Simulated download of ${f.name}` }))
                                }
                                className="flex items-center gap-1.5 text-primary-600 hover:underline max-w-[160px] truncate"
                                title={f.name}
                              >
                                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{f.name}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic">No files</span>
                        )}
                        {sub.note && (
                          <p className="text-[11px] text-muted-foreground italic mt-0.5 line-clamp-1" title={sub.note}>
                            &ldquo;{sub.note}&rdquo;
                          </p>
                        )}
                      </td>
                      <td className="p-3.5">
                        {sub.status === 'GRADED' && typeof sub.marks === 'number' ? (
                          <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                            {sub.marks} / {assignment.maxMarks}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 font-mono">-</span>
                        )}
                      </td>
                      <td className="p-3.5 max-w-[180px]">
                        {sub.feedback ? (
                          <p className="text-xs text-muted-foreground italic line-clamp-1" title={sub.feedback}>
                            {sub.feedback}
                          </p>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant={sub.status === 'GRADED' ? 'outline' : 'primary'}
                          onClick={() => handleOpenGradeModal(sub)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{sub.status === 'GRADED' ? 'Re-grade' : 'Grade'}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Grade Submission Dialog */}
      <Dialog
        isOpen={!!gradingSubmission}
        onClose={() => setGradingSubmission(null)}
        title={`Grade Submission: ${gradingSubmission?.student.name}`}
        description={`Award marks and provide student feedback for "${assignment.title}".`}
      >
        {gradingSubmission && (
          <form onSubmit={handleSaveGrade} className="space-y-4 pt-2">
            {gradeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                {gradeError}
              </div>
            )}

            {/* Student Submitted Work Summary */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Submitted Files:</span>
                <span className="text-muted-foreground">
                  {gradingSubmission.submittedAt ? formatDate(gradingSubmission.submittedAt, 'MMM d, h:mm a') : 'No file upload'}
                </span>
              </div>
              {gradingSubmission.files && gradingSubmission.files.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {gradingSubmission.files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() =>
                        dispatch(addToast({ type: 'info', message: `Simulated download of ${file.name}` }))
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-primary-600 font-medium cursor-pointer hover:bg-muted"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{file.name}</span>
                      <Download className="w-3 h-3 text-muted-foreground ml-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Student has not attached any file yet.</p>
              )}

              {gradingSubmission.note && (
                <div className="pt-2 border-t border-border/60">
                  <span className="font-semibold text-foreground">Student Note:</span>
                  <p className="text-muted-foreground italic mt-0.5">&ldquo;{gradingSubmission.note}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Marks Input */}
            <Input
              label={`Marks (Max: ${assignment.maxMarks})`}
              type="number"
              min="0"
              max={assignment.maxMarks}
              step="1"
              value={marksInput}
              onChange={(e) => setMarksInput(e.target.value)}
              placeholder={`0 - ${assignment.maxMarks}`}
              required
            />

            {/* Feedback Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Instructor Feedback & Comments</label>
              <textarea
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="Provide constructive feedback, notes on coding style, test coverage..."
                rows={3}
                className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGradingSubmission(null)}
                disabled={isGradingSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isGradingSubmitting}>
                Save Grade & Feedback
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};

export default SubmissionsPage;
