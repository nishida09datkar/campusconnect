import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { assignmentService } from '@/api/services/assignment.service';
import { submissionService } from '@/api/services/submission.service';
import { classroomService, EnrichedClassRoom } from '@/api/services/classroom.service';
import { Assignment, Submission, Attachment } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/format';
import {
  ArrowLeft,
  Clock,
  Award,
  Paperclip,
  Download,
  UploadCloud,
  FileCode,
  FileText,
  MessageSquare,
  Check,
} from 'lucide-react';

export const AssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const assignmentId = id || '';

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [classroom, setClassroom] = useState<EnrichedClassRoom | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Submission Form State
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSizeKb, setSelectedFileSizeKb] = useState(0);
  const [studentNote, setStudentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    if (!assignmentId || !user) return;
    try {
      setIsLoading(true);
      const assign = await assignmentService.getAssignmentById(assignmentId);
      // A draft is not published yet, so for a student it does not exist
      if (!assign || assign.status === 'DRAFT') throw new Error('Assignment not found');
      setAssignment(assign);

      const [cls, sub] = await Promise.all([
        classroomService.getClassById(assign.classId),
        submissionService.getStudentSubmission(assignmentId, user.id),
      ]);

      setClassroom(cls);
      setSubmission(sub);
      // The form belongs to this assignment: drop whatever was picked or typed for another one
      setSelectedFileName('');
      setSelectedFileSizeKb(0);
      setStudentNote(sub?.note || '');
      setErrorMessage('');
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to load assignment details' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assignmentId, user]);

  const handleSelectLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setSelectedFileSizeKb(Math.round(file.size / 1024) || 24);
      setErrorMessage('');
    }
  };

  const handlePickMockTemplate = (templateName: string) => {
    setSelectedFileName(templateName);
    setSelectedFileSizeKb(Math.floor(250 + Math.random() * 800));
    setErrorMessage('');
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignment) return;

    // Must have either a new file selected or already submitted file
    const effectiveFileName = selectedFileName || submission?.files?.[0]?.name;
    if (!effectiveFileName) {
      setErrorMessage('Please attach a solution file or select one of the templates');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const files: Attachment[] = selectedFileName
        ? [
            {
              id: `att-sub-${Date.now()}`,
              name: selectedFileName,
              sizeKb: selectedFileSizeKb || 350,
              mime: selectedFileName.endsWith('.zip')
                ? 'application/zip'
                : selectedFileName.endsWith('.pdf')
                ? 'application/pdf'
                : 'text/plain',
              url: '#',
            },
          ]
        : submission?.files || [];

      const result = await submissionService.submitAssignment(assignment.id, user.id, {
        note: studentNote.trim(),
        files,
      });

      setSubmission(result);
      setSelectedFileName('');
      dispatch(
        addToast({
          type: 'success',
          message:
            result.status === 'LATE'
              ? 'Assignment submitted (marked Late).'
              : 'Assignment successfully turned in!',
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">Assignment Not Found</h2>
        <Link to="/student/classes">
          <Button variant="outline">Back to Classes</Button>
        </Link>
      </div>
    );
  }

  const isOverdue = new Date() > new Date(assignment.dueAt);
  const isGraded = submission?.status === 'GRADED';
  const isSubmitted = submission?.status === 'SUBMITTED' || submission?.status === 'LATE' || isGraded;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={`/student/classes/${assignment.classId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {classroom?.title || 'Classroom'}
        </Link>
      </div>

      {/* Main Grid: Assignment details (2 cols) + Submission Box (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Problem Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-primary-500/10 text-primary-600">
                  {classroom?.course?.code || 'COURSE'}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Section {classroom?.section || 'A'}
                </span>
              </div>
              <span className="text-xs font-bold text-foreground">
                Max Marks: {assignment.maxMarks}
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-foreground">{assignment.title}</h1>
              <p className="text-xs text-muted-foreground">
                Instructor: {classroom?.faculty?.name || 'Faculty Professor'} &bull; Assigned for {classroom?.title}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs pt-1">
              <span className={`flex items-center gap-1 font-semibold ${isOverdue ? 'text-rose-500' : 'text-amber-600'}`}>
                <Clock className="w-3.5 h-3.5" /> Due: {formatDate(assignment.dueAt, 'EEEE, MMM d, yyyy h:mm a')}
              </span>
              {isOverdue && !isSubmitted && (
                <Badge variant="danger">Past Due Date</Badge>
              )}
            </div>
          </Card>

          {/* Instructions Card */}
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" /> Instructions & Problem Statement
            </h3>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {assignment.instructions}
            </div>
          </Card>

          {/* Instructor Reference Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <Card className="p-6 space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary-500" /> Instructor Attachments & Rubrics
              </h3>
              <div className="space-y-2">
                {assignment.attachments.map((att) => (
                  <div
                    key={att.id}
                    onClick={() =>
                      dispatch(addToast({ type: 'info', message: `Simulated download of ${att.name}` }))
                    }
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <FileCode className="w-5 h-5 text-primary-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground truncate">{att.name}</p>
                        <p className="text-[10px] text-muted-foreground">{att.sizeKb} KB</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Evaluation & Feedback Banner if Graded */}
          {isGraded && (
            <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  <Award className="w-5 h-5" />
                  <span>Evaluation & Feedback</span>
                </div>
                <span className="text-lg font-extrabold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
                  {submission.marks} / {assignment.maxMarks} Marks
                </span>
              </div>

              {submission.feedback && (
                <div className="p-3.5 rounded-xl bg-card border border-emerald-500/20 text-xs text-foreground/90 space-y-1">
                  <span className="font-semibold text-emerald-600 block">Instructor Feedback:</span>
                  <p className="italic">&ldquo;{submission.feedback}&rdquo;</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column: Submission Action Box */}
        <div className="space-y-6">
          <Card className="p-6 space-y-5 sticky top-20 shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Your Work</h3>
              <Badge
                variant={
                  isGraded
                    ? 'success'
                    : submission?.status === 'SUBMITTED'
                    ? 'info'
                    : submission?.status === 'LATE'
                    ? 'warning'
                    : 'secondary'
                }
                className="text-xs px-2.5 py-0.5 uppercase font-bold"
              >
                {submission?.status || 'NOT SUBMITTED'}
              </Badge>
            </div>

            {/* If Already Submitted Work Exists */}
            {isSubmitted && submission?.files && submission.files.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground block">Submitted Files:</span>
                {submission.files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() =>
                      dispatch(addToast({ type: 'info', message: `Simulated download of ${file.name}` }))
                    }
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-4 h-4 text-primary-500 shrink-0" />
                      <span className="font-medium truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{file.sizeKb} KB</span>
                  </div>
                ))}

                {submission.submittedAt && (
                  <p className="text-[11px] text-muted-foreground">
                    Turned in {formatDate(submission.submittedAt, 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
            )}

            {/* Submission Form: graded work is final, so there is nothing left to turn in */}
            {!isGraded && (
              <form onSubmit={handleSubmitWork} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* File Upload Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-foreground/80">
                    {isSubmitted ? 'Replace / Upload Solution File' : 'Attach Solution File'}
                  </label>

                  {/* Selected File Preview */}
                  {selectedFileName ? (
                    <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate text-xs text-primary-700 dark:text-primary-300 font-semibold">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{selectedFileName}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">({selectedFileSizeKb} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFileName('')}
                        className="text-xs text-muted-foreground hover:text-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Native file input */}
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border hover:border-primary-500/50 rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                        <UploadCloud className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs font-medium text-foreground">Click to browse file</span>
                        <span className="text-[10px] text-muted-foreground">ZIP, PDF, TS, or JS code file</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleSelectLocalFile}
                        />
                      </label>

                      {/* Quick Mock File Templates for Pair-Programming Testing */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                          Or pick a test file:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            `${user?.name?.split(' ')[0] || 'Aryan'}_Solution.zip`,
                            'Lab_Report.pdf',
                            'App_Submission.tsx',
                          ].map((tmpl) => (
                            <button
                              type="button"
                              key={tmpl}
                              onClick={() => handlePickMockTemplate(tmpl)}
                              className="px-2 py-1 rounded-md bg-muted text-[11px] font-medium text-foreground hover:bg-primary-500/10 hover:text-primary-600 transition-colors border border-border"
                            >
                              + {tmpl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Private Student Comment / Note */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /> Private Note to Instructor
                  </label>
                  <textarea
                    value={studentNote}
                    onChange={(e) => setStudentNote(e.target.value)}
                    placeholder="Add any notes about your implementation, test coverage, or execution instructions..."
                    rows={2}
                    className="w-full rounded-xl border border-input bg-card p-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                {/* Submit / Resubmit Button */}
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full shadow-sm text-xs font-bold h-10"
                >
                  {isSubmitted ? 'Resubmit Assignment' : 'Turn In Work'}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
