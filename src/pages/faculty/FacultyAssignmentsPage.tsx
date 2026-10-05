import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { assignmentService, EnrichedAssignment } from '@/api/services/assignment.service';
import { classroomService, EnrichedClassRoom } from '@/api/services/classroom.service';
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
  ExternalLink,
  Search,
  BookOpen,
  Filter,
} from 'lucide-react';

export const FacultyAssignmentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
  const [classes, setClasses] = useState<EnrichedClassRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    Promise.all([
      assignmentService.getFacultyAssignments(user.id),
      classroomService.getFacultyClasses(user.id),
    ])
      .then(([assignList, classList]) => {
        setAssignments(assignList);
        setClasses(classList);
      })
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
    if (selectedClassId === 'ALL') return true;
    return a.classId === selectedClassId;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Faculty Assignments"
        description="Monitor assignments across all your teaching classes and review student submission counts"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search assignment or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            aria-label="Filter assignments by class"
            className="flex h-10 w-full sm:w-56 rounded-xl border border-input bg-card px-3.5 py-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="ALL">All Classrooms ({classes.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.title}
              </option>
            ))}
          </select>
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
            {searchQuery || selectedClassId !== 'ALL'
              ? 'No assignments match the selected filters.'
              : 'Create assignments inside your teaching classrooms to see them listed here.'}
          </p>
          <Link to="/faculty/classes">
            <Button size="sm" variant="outline" className="mt-3">
              Go to Classes
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((assign) => (
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

                  <p className="text-xs text-muted-foreground">
                    Class: <span className="font-semibold text-foreground">{assign.classTitle}</span> &bull; Max Marks: <strong>{assign.maxMarks}</strong>
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" /> Due: {formatDate(assign.dueAt, 'MMM d, yyyy h:mm a')}
                    </span>
                    <span>
                      Submissions: <strong className="text-foreground">{assign.submissionsCount}</strong> / {assign.totalStudents}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/faculty/classes/${assign.classId}`}>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Classroom
                    </Button>
                  </Link>
                  <Link to={`/faculty/assignments/${assign.id}/submissions`}>
                    <Button size="sm" className="text-xs gap-1.5 shadow-sm">
                      <span>View Submissions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyAssignmentsPage;
