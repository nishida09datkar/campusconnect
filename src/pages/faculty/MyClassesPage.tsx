import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser } from '@/features/auth/authSelectors';
import { addToast } from '@/features/ui/uiSlice';
import { classroomService, EnrichedClassRoom } from '@/api/services/classroom.service';
import { courseService } from '@/api/services/course.service';
import { Course } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Copy,
  Check,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

const COVER_GRADIENTS = [
  { label: 'Indigo Purple', value: 'from-indigo-600 to-purple-600' },
  { label: 'Blue Cyan', value: 'from-blue-600 to-cyan-600' },
  { label: 'Emerald Teal', value: 'from-emerald-600 to-teal-600' },
  { label: 'Amber Orange', value: 'from-amber-600 to-orange-600' },
  { label: 'Rose Pink', value: 'from-rose-600 to-pink-600' },
  { label: 'Violet Fuchsia', value: 'from-violet-600 to-fuchsia-600' },
];

export const MyClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const [classes, setClasses] = useState<EnrichedClassRoom[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Class Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [classTitle, setClassTitle] = useState('');
  const [classSection, setClassSection] = useState('A');
  const [coverColor, setCoverColor] = useState(COVER_GRADIENTS[0].value);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [classList, courseList] = await Promise.all([
        classroomService.getFacultyClasses(user.id),
        courseService.getAllCourses(),
      ]);
      setClasses(classList);
      setCourses(courseList);
      if (courseList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(courseList[0].id);
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to load classes' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    dispatch(addToast({ type: 'info', message: `Copied class code ${code} to clipboard` }));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setFormError('');
    if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
      setClassTitle(`${courses[0].title} (Sec A)`);
    } else {
      setClassTitle('');
    }
    setClassSection('A');
    setCoverColor(COVER_GRADIENTS[0].value);
    setIsCreateOpen(true);
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const c = courses.find((item) => item.id === courseId);
    if (c) {
      setClassTitle(`${c.title} (Sec ${classSection})`);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedCourseId) {
      setFormError('Please select a course');
      return;
    }
    if (!classTitle.trim()) {
      setFormError('Please enter a class title');
      return;
    }
    if (!classSection.trim()) {
      setFormError('Please enter a section name');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      const newClass = await classroomService.createClass(user.id, {
        courseId: selectedCourseId,
        title: classTitle.trim(),
        section: classSection.trim(),
        coverColor,
      });

      setClasses((prev) => [newClass, ...prev]);
      setIsCreateOpen(false);
      dispatch(
        addToast({
          type: 'success',
          message: `Classroom created! Share code ${newClass.classCode} with students.`,
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create class';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClasses = classes.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesTitle = c.title.toLowerCase().includes(q);
    const matchesCode = c.classCode.toLowerCase().includes(q);
    const matchesCourse = c.course?.title.toLowerCase().includes(q) || c.course?.code.toLowerCase().includes(q);
    return matchesTitle || matchesCode || matchesCourse;
  });

  const totalStudents = classes.reduce((sum, c) => sum + c.studentsCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Classes"
        description="Manage active teaching classrooms, generate class codes, track enrollment rosters, and create course sections"
        actions={
          <Button onClick={handleOpenCreateModal} className="gap-2 shadow-md shadow-primary-500/20">
            <Plus className="w-4 h-4" />
            Create Class
          </Button>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Taught Classrooms</span>
              <p className="text-2xl font-extrabold text-foreground">{classes.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Students</span>
              <p className="text-2xl font-extrabold text-foreground">{totalStudents}</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Available Courses</span>
              <p className="text-2xl font-extrabold text-foreground">{courses.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search class, code, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <p className="text-xs text-muted-foreground self-start sm:self-center">
          Showing {filteredClasses.length} of {classes.length} classes
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
      ) : filteredClasses.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Classrooms Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'No teaching classes match your current search query.'
                : 'You have not created any classrooms yet. Click Create Class to start teaching.'}
            </p>
            {!searchQuery && (
              <Button onClick={handleOpenCreateModal} size="sm" className="mt-2">
                <Plus className="w-4 h-4 mr-1.5" /> Create First Class
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col">
              {/* Cover Gradient Header */}
              <div className={`h-28 p-4 bg-gradient-to-r ${cls.coverColor} text-white flex flex-col justify-between relative`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/25 backdrop-blur-sm">
                    {cls.course?.code || 'COURSE'}
                  </span>
                  <button
                    onClick={() => handleCopyCode(cls.classCode)}
                    title="Click to copy student invite code"
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/25 hover:bg-black/40 backdrop-blur-sm text-xs font-mono font-medium transition-colors"
                  >
                    {copiedCode === cls.classCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="text-emerald-200">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 opacity-80" />
                        <span>{cls.classCode}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-bold text-lg leading-tight truncate drop-shadow-sm">{cls.title}</h3>
                  <p className="text-xs text-white/80 font-medium truncate">
                    {cls.course?.title || 'Academic Course'} &bull; Sec {cls.section}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Users className="w-4 h-4 text-primary-500" />
                      {cls.studentsCount} Students Enrolled
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold">
                      Section {cls.section}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    Instructor: <span className="font-medium text-foreground">{cls.faculty?.name || user?.name}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-border">
                  <Link to={`/faculty/classes/${cls.id}`} className="block w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs justify-between group-hover:border-primary-500 group-hover:text-primary-600 transition-colors"
                    >
                      <span className="font-semibold">Open Classroom</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Class Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Classroom"
        description="Launch an academic course space. Students can enroll using the automatically generated class code."
      >
        <form onSubmit={handleCreateClass} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Course Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">Academic Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  [{course.code}] {course.title} (Year {course.year})
                </option>
              ))}
            </select>
          </div>

          {/* Class Title */}
          <Input
            label="Class Title"
            value={classTitle}
            onChange={(e) => setClassTitle(e.target.value)}
            placeholder="e.g. Web Development (CE-A)"
            required
          />

          {/* Section */}
          <Input
            label="Section / Division"
            value={classSection}
            onChange={(e) => setClassSection(e.target.value)}
            placeholder="e.g. A or B"
            required
          />

          {/* Cover Color Theme */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              Class Cover Theme
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {COVER_GRADIENTS.map((g) => (
                <button
                  type="button"
                  key={g.value}
                  onClick={() => setCoverColor(g.value)}
                  className={`h-11 rounded-xl bg-gradient-to-r ${g.value} p-1 text-white text-[11px] font-semibold flex items-center justify-center transition-all ${
                    coverColor === g.value
                      ? 'ring-2 ring-primary ring-offset-2 scale-[1.03] shadow-md'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {coverColor === g.value && <Check className="w-4 h-4 mr-1 stroke-[3]" />}
                  {g.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Classroom
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default MyClassesPage;
