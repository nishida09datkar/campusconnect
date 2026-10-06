import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/features/ui/uiSlice';
import { departmentService } from '@/api/services/department.service';
import { userService } from '@/api/services/user.service';
import { DepartmentWithDetails, User } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  BookOpen,
  GraduationCap,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // State
  const [departments, setDepartments] = useState<DepartmentWithDetails[]>([]);
  const [potentialHods, setPotentialHods] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentWithDetails | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formHodId, setFormHodId] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; code?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deptToDelete, setDeptToDelete] = useState<DepartmentWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load departments & potential HODs
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deptsData, hodsData] = await Promise.all([
        departmentService.getDepartmentsWithDetails(),
        userService.getPotentialHods(),
      ]);
      setDepartments(deptsData);
      setPotentialHods(hodsData);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Failed to load departments';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle open create/edit dialog
  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormName('');
    setFormCode('');
    setFormHodId(potentialHods[0]?.id || '');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentWithDetails) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormHodId(dept.hodId);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; code?: string } = {};

    if (!formName.trim()) {
      errors.name = 'Department name is required';
    }
    if (!formCode.trim()) {
      errors.code = 'Department code is required (e.g. CE, IT)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept.id, {
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          hodId: formHodId,
        });
        dispatch(
          addToast({
            type: 'success',
            message: `Department '${formName.trim()}' updated successfully.`,
          })
        );
      } else {
        await departmentService.createDepartment({
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          hodId: formHodId,
        });
        dispatch(
          addToast({
            type: 'success',
            message: `Department '${formName.trim()}' created successfully.`,
          })
        );
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Failed to save department';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      const res = await departmentService.deleteDepartment(deptToDelete.id);
      dispatch(
        addToast({
          type: 'success',
          message: res.message || 'Department deleted successfully.',
        })
      );
      setDeptToDelete(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Failed to delete department';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter departments by search
  const filteredDepartments = departments.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.hodName && d.hodName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments Management"
        description="Oversee academic faculties, program abbreviations, head-of-department appointments, and faculty enrollment"
        actions={
          <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        }
      />

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Departments</span>
              <p className="text-2xl font-bold text-foreground mt-0.5">{departments.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">Faculty Members</span>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {departments.reduce((acc, d) => acc + (d.facultyCount || 0), 0)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Courses</span>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {departments.reduce((acc, d) => acc + (d.courseCount || 0), 0)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle>Academic Departments</CardTitle>
            <CardDescription>Configured branches and their administrative leadership</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name, HOD..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm text-foreground font-semibold">{error}</p>
              <Button size="sm" variant="outline" onClick={loadData} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </Button>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">No departments found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? `No departments matching "${searchQuery}". Try a different keyword.`
                  : 'Get started by creating your first academic department.'}
              </p>
              {searchQuery && (
                <Button size="sm" variant="ghost" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Department Name</th>
                    <th className="py-3 px-4">Head of Department (HOD)</th>
                    <th className="py-3 px-4 text-center">Faculty</th>
                    <th className="py-3 px-4 text-center">Students</th>
                    <th className="py-3 px-4 text-center">Courses</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                          {dept.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {dept.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                            {dept.hodName}
                          </p>
                          {dept.hodEmail && (
                            <p className="text-[11px] text-muted-foreground">{dept.hodEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-foreground">
                        {dept.facultyCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-foreground">
                        {dept.studentCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-foreground">
                        {dept.courseCount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(dept)}
                            title="Edit department"
                            aria-label={`Edit ${dept.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeptToDelete(dept)}
                            title="Delete department"
                            aria-label={`Delete ${dept.name}`}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Department Dialog */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create Department'}
        description={
          editingDept
            ? `Update program configuration for ${editingDept.code}`
            : 'Establish a new institutional department and assign its department head'
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Department Code *"
            placeholder="e.g. CE, IT, ME"
            value={formCode}
            onChange={(e) => {
              setFormCode(e.target.value);
              if (formErrors.code) setFormErrors({ ...formErrors, code: undefined });
            }}
            error={formErrors.code}
            helperText="Short capital abbreviation (2-5 letters)"
            maxLength={10}
          />

          <Input
            label="Department Name *"
            placeholder="e.g. Computer Engineering"
            value={formName}
            onChange={(e) => {
              setFormName(e.target.value);
              if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
            }}
            error={formErrors.name}
            helperText="Official full title of the department"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground/80">
              Head of Department (HOD)
            </label>
            <select
              value={formHodId}
              onChange={(e) => setFormHodId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
            >
              <option value="">-- Select Department Head --</option>
              {potentialHods.map((hod) => (
                <option key={hod.id} value={hod.id}>
                  {hod.name} ({hod.role} - {hod.designation || hod.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Select an existing HOD or senior faculty member to head this department
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deptToDelete)}
        onClose={() => setDeptToDelete(null)}
        title="Delete Department?"
        description="This action cannot be undone. All faculty and students will need to be reallocated."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 space-y-1">
            <p className="font-bold">
              Warning: Deleting {deptToDelete?.name} ({deptToDelete?.code})
            </p>
            <p>
              This will remove this academic unit from institute records. Courses under this department
              will lose their department affiliation.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeptToDelete(null)}
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
              Confirm Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DepartmentsPage;
