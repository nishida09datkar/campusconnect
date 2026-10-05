import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { classroomService, EnrichedClassRoom } from '@/api/services/classroom.service';
import { assignmentService } from '@/api/services/assignment.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BookOpen,
  PlusCircle,
  Search,
  ArrowRight,
  GraduationCap,
  KeyRound,
  FileText,
  UserCheck,
} from 'lucide-react';

interface StudentClassWithStats extends EnrichedClassRoom {
  assignmentCount: number;
}

export const StudentClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const [classes, setClasses] = useState<StudentClassWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Join Class Modal State
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const loadClasses = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const studentClasses = await classroomService.getStudentClasses(user.id);

      // Fetch assignment counts for each class
      const enrichedWithCounts: StudentClassWithStats[] = await Promise.all(
        studentClasses.map(async (cls) => {
          const assignments = await assignmentService.getClassAssignments(cls.id, false);
          return {
            ...cls,
            assignmentCount: assignments.length,
          };
        })
      );

      setClasses(enrichedWithCounts);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to load enrolled classes' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [user]);

  const handleOpenJoin = () => {
    setJoinCode('');
    setJoinError('');
    setIsJoinOpen(true);
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedCode = joinCode.trim();
    if (!trimmedCode) {
      setJoinError('Please enter a class code');
      return;
    }

    try {
      setIsJoining(true);
      setJoinError('');

      const joinedClass = await classroomService.joinClassByCode(trimmedCode, user.id);
      const assignments = await assignmentService.getClassAssignments(joinedClass.id, false);

      const classWithStats: StudentClassWithStats = {
        ...joinedClass,
        assignmentCount: assignments.length,
      };

      setClasses((prev) => [classWithStats, ...prev]);
      setIsJoinOpen(false);
      setJoinCode('');

      dispatch(
        addToast({
          type: 'success',
          message: `Successfully joined ${joinedClass.title}!`,
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join class';
      setJoinError(msg);
    } finally {
      setIsJoining(false);
    }
  };

  const filtered = classes.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.course?.code && c.course.code.toLowerCase().includes(q)) ||
      (c.course?.title && c.course.title.toLowerCase().includes(q)) ||
      (c.faculty?.name && c.faculty.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Enrolled Classes"
        description="Access learning materials, classwork announcements, assignment submissions, and enter new classroom codes"
        actions={
          <Button onClick={handleOpenJoin} className="gap-2 shadow-md shadow-primary-500/20">
            <PlusCircle className="w-4 h-4" />
            Join Class with Code
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Enrolled Classes</span>
              <p className="text-2xl font-extrabold text-foreground">{classes.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Active Assignments</span>
              <p className="text-2xl font-extrabold text-foreground">
                {classes.reduce((sum, c) => sum + c.assignmentCount, 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Student Portal</span>
              <p className="text-sm font-bold text-foreground">
                Roll: {user?.rollNo || 'CE301'} (Div {user?.division || 'A'})
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search enrolled course or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <p className="text-xs text-muted-foreground self-start sm:self-center">
          Showing {filtered.length} of {classes.length} classes
        </p>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-28 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Enrolled Classes Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'No classes matched your search filter.'
                : 'You are not enrolled in any classrooms yet. Ask your instructor for the classroom code to join.'}
            </p>
            {!searchQuery && (
              <Button onClick={handleOpenJoin} size="sm" className="mt-2">
                <KeyRound className="w-4 h-4 mr-1.5" /> Join with Class Code
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cls) => (
            <Card key={cls.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col">
              {/* Header Gradient */}
              <div className={`h-28 p-4 bg-gradient-to-r ${cls.coverColor} text-white flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/25 backdrop-blur-sm">
                    {cls.course?.code || 'CE301'}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-black/25 backdrop-blur-sm">
                    Section {cls.section}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight truncate drop-shadow-sm">{cls.title}</h3>
                  <p className="text-xs text-white/80 truncate font-medium">{cls.course?.title}</p>
                </div>
              </div>

              {/* Body */}
              <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground block">Course Instructor</span>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary-500" />
                      {cls.faculty?.name || 'Faculty Professor'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <strong>{cls.assignmentCount}</strong> Assignments
                    </span>
                    <span>{cls.studentsCount} Classmates</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to={`/student/classes/${cls.id}`} className="block w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs justify-between group-hover:border-primary-500 group-hover:text-primary-600 transition-colors"
                    >
                      <span className="font-semibold">Open Class</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Join Class Modal */}
      <Dialog
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        title="Join Classroom"
        description="Enter the 6-character classroom code provided by your instructor."
      >
        <form onSubmit={handleJoinClass} className="space-y-4 pt-2">
          {joinError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
              {joinError}
            </div>
          )}

          <div className="space-y-1.5">
            <Input
              label="Class Code"
              placeholder="e.g. WEB3A1 or DBS3A2"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              leftIcon={<KeyRound className="w-4 h-4 text-muted-foreground" />}
              helperText="Ask your teacher for the class code, then enter it here."
              autoFocus
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsJoinOpen(false)}
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isJoining}>
              Join Classroom
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default StudentClassesPage;
