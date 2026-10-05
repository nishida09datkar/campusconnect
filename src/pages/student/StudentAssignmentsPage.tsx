import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { assignmentService, EnrichedAssignment } from '@/api/services/assignment.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/format';
import {
  FileText,
  Clock,
  ArrowRight,
  Search,
  BookOpen,
  Filter,
} from 'lucide-react';

export const StudentAssignmentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DUE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    assignmentService
      .getStudentAssignments(user.id)
      .then(setAssignments)
      .catch(() => {
        dispatch(addToast({ type: 'error', message: 'Failed to load assignments' }));
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  const filtered = assignments.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(q) ||
      (a.classTitle && a.classTitle.toLowerCase().includes(q)) ||
      (a.courseCode && a.courseCode.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'DUE') {
      return a.submissionStatus === 'PENDING';
    }
    if (statusFilter === 'COMPLETED') {
      return a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'LATE' || a.submissionStatus === 'GRADED';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Assignments"
        description="All homework, lab deliverables, and assignments across your enrolled courses"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search by assignment or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          {(['ALL', 'DUE', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'ALL' ? 'All Work' : st === 'DUE' ? 'To Do (Due)' : 'Turned In / Graded'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-bold text-foreground">No Assignments Found</h3>
          <p className="text-xs text-muted-foreground">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No assignments match the selected filter.'
              : 'You have no assignments assigned right now.'}
          </p>
          <Link to="/student/classes">
            <Button size="sm" variant="outline" className="mt-3">
              View Classes
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((assign) => {
            const isCompleted =
              assign.submissionStatus === 'SUBMITTED' ||
              assign.submissionStatus === 'LATE' ||
              assign.submissionStatus === 'GRADED';

            return (
              <Card key={assign.id} className="p-5 hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted">
                        {assign.courseCode || 'COURSE'}
                      </span>
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
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Course Class: <span className="font-semibold text-foreground">{assign.classTitle}</span> &bull; Max Marks: <strong>{assign.maxMarks}</strong>
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Due: {formatDate(assign.dueAt, 'MMM d, yyyy h:mm a')}
                      </span>
                      {assign.submissionStatus === 'GRADED' && typeof assign.marks === 'number' && (
                        <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Marks: {assign.marks} / {assign.maxMarks}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/student/classes/${assign.classId}`}>
                      <Button size="sm" variant="outline" className="text-xs gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> Class
                      </Button>
                    </Link>
                    <Link to={`/student/assignments/${assign.id}`}>
                      <Button
                        size="sm"
                        variant={isCompleted ? 'outline' : 'primary'}
                        className="text-xs gap-1.5 shadow-sm"
                      >
                        <span>{isCompleted ? 'View Work' : 'Turn In'}</span>
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
  );
};

export default StudentAssignmentsPage;
