import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { allocationService } from '@/api/services/allocation.service';
import { courseService } from '@/api/services/course.service';
import { userService } from '@/api/services/user.service';
import { departmentService } from '@/api/services/department.service';
import { Course, User, FacultyAllocationWithDetails, Department } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BookOpen,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const FacultyAllocationPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const deptId = currentUser?.departmentId || 'dept-ce';

  // State
  const [department, setDepartment] = useState<Department | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [allocations, setAllocations] = useState<FacultyAllocationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Allocate Dialog
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [isAllocating, setIsAllocating] = useState(false);

  // Remove Allocation Dialog
  const [allocToDelete, setAllocToDelete] = useState<FacultyAllocationWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data
  const loadAllocationData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deptData, coursesData, facultyData, allocsData] = await Promise.all([
        departmentService.getDepartmentById(deptId),
        courseService.getCoursesByDepartment(deptId),
        userService.getDepartmentFaculty(deptId),
        allocationService.getAllocationsByDepartment(deptId),
      ]);

      setDepartment(deptData);
      setCourses(coursesData);
      setFaculty(facultyData);
      setAllocations(allocsData);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load allocation data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [deptId]);

  useEffect(() => {
    loadAllocationData();
  }, [loadAllocationData]);

  // Open modal with pre-selected course if clicked
  const handleOpenAllocateModal = (preCourseId?: string) => {
    setSelectedCourseId(preCourseId || courses[0]?.id || '');
    setSelectedFacultyId(faculty[0]?.id || '');
    setIsAllocateOpen(true);
  };

  // Submit allocation
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedFacultyId) {
      dispatch(addToast({ type: 'warning', message: 'Please select both a course and a faculty member.' }));
      return;
    }

    setIsAllocating(true);
    try {
      const newAlloc = await allocationService.createAllocation(
        selectedFacultyId,
        selectedCourseId,
        deptId
      );
      dispatch(
        addToast({
          type: 'success',
          message: `Allocated ${newAlloc.facultyName} to ${newAlloc.courseCode}.`,
        })
      );
      setIsAllocateOpen(false);
      await loadAllocationData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create allocation';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsAllocating(false);
    }
  };

  // Confirm delete allocation
  const handleDeleteConfirm = async () => {
    if (!allocToDelete) return;
    setIsDeleting(true);
    try {
      await allocationService.deleteAllocation(allocToDelete.id);
      dispatch(
        addToast({
          type: 'success',
          message: `Removed ${allocToDelete.facultyName} from ${allocToDelete.courseCode}.`,
        })
      );
      setAllocToDelete(null);
      await loadAllocationData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to delete allocation';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Faculty & Course Allocation — ${department?.name || 'Department'}`}
        description={`Allocate department professors to curriculum syllabus courses for ${department?.code || ''}`}
        actions={
          <Button onClick={() => handleOpenAllocateModal()} className="gap-2 shadow-sm text-xs">
            <Plus className="w-4 h-4" /> New Allocation
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm text-foreground font-semibold">{error}</p>
          <Button size="sm" variant="outline" onClick={loadAllocationData} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT PANEL: Department Courses */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Department Courses ({courses.length})
                  </CardTitle>
                  <CardDescription>Curriculum courses and allocated teaching staff</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {courses.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No courses registered in this department yet.
                </div>
              ) : (
                courses.map((course) => {
                  const courseAllocs = allocations.filter((a) => a.courseId === course.id);
                  return (
                    <div
                      key={course.id}
                      className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
                              {course.code}
                            </span>
                            <span className="text-xs text-muted-foreground">Year {course.year}</span>
                          </div>
                          <h4 className="text-sm font-bold text-foreground mt-1">{course.title}</h4>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAllocateModal(course.id)}
                          className="h-8 px-2.5 text-xs gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Assign
                        </Button>
                      </div>

                      {/* Allocated Faculty Chips */}
                      <div className="space-y-1.5 pt-2 border-t border-border/60">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Allocated Faculty ({courseAllocs.length})
                        </span>
                        {courseAllocs.length === 0 ? (
                          <p className="text-xs text-amber-600 dark:text-amber-400 italic flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> Unassigned — needs faculty allocation
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {courseAllocs.map((alloc) => (
                              <div
                                key={alloc.id}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground font-medium group"
                              >
                                <GraduationCap className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                <span>{alloc.facultyName}</span>
                                <button
                                  onClick={() => setAllocToDelete(alloc)}
                                  className="text-muted-foreground hover:text-rose-500 p-0.5 rounded transition-colors ml-1"
                                  title="Remove allocation"
                                  aria-label={`Remove ${alloc.facultyName} from ${course.code}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* RIGHT PANEL: Department Faculty */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Department Faculty ({faculty.length})
                  </CardTitle>
                  <CardDescription>Teaching staff workload and course load distribution</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {faculty.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No professors registered under this department.
                </div>
              ) : (
                faculty.map((fac) => {
                  const facAllocs = allocations.filter((a) => a.facultyId === fac.id);
                  return (
                    <div
                      key={fac.id}
                      className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar src={fac.avatarUrl} name={fac.name} size="md" />
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{fac.name}</h4>
                            <p className="text-[11px] text-muted-foreground">
                              {fac.designation || 'Faculty'} • {fac.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            facAllocs.length > 0
                              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {facAllocs.length} Course{facAllocs.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {/* Course tags */}
                      <div className="pt-2 border-t border-border/60 space-y-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Teaching Assignments:
                        </span>
                        {facAllocs.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No courses currently allocated</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {facAllocs.map((a) => (
                              <span
                                key={a.id}
                                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] inline-flex items-center gap-1.5"
                              >
                                <span>{a.courseCode}: {a.courseTitle}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Allocate Faculty Modal */}
      <Dialog
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        title="Allocate Faculty to Course"
        description={`Assign a department professor to teach this curriculum subject in ${department?.code || ''}`}
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">
              Department Course *
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title} (Year {c.year})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">
              Faculty Professor *
            </label>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.designation || 'Faculty'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAllocateOpen(false)}
              disabled={isAllocating}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isAllocating} className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Confirm Allocation
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Remove Allocation Dialog */}
      <Dialog
        isOpen={Boolean(allocToDelete)}
        onClose={() => setAllocToDelete(null)}
        title="Remove Faculty Allocation?"
        description="Are you sure you want to remove this teaching assignment?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 space-y-1">
            <p className="font-bold">
              Unassign {allocToDelete?.facultyName} from {allocToDelete?.courseCode} ({allocToDelete?.courseTitle})
            </p>
            <p>
              This professor will no longer be designated as the course instructor for this subject.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAllocToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Confirm Removal
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default FacultyAllocationPage;
