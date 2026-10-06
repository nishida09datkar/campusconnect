import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/features/ui/uiSlice';
import { userService } from '@/api/services/user.service';
import { departmentService } from '@/api/services/department.service';
import { User, Role, Department } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Users,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Add / Edit User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<Role>('STUDENT');
  const [formDeptId, setFormDeptId] = useState('');
  const [formRollNo, setFormRollNo] = useState('');
  const [formYear, setFormYear] = useState<number>(3);
  const [formDivision, setFormDivision] = useState('A');
  const [formEmpId, setFormEmpId] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk CSV Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // Fetch departments & users
  const loadDepartments = useCallback(async () => {
    try {
      const depts = await departmentService.getAllDepartments();
      setDepartments(depts);
    } catch (err) {
      console.error('Failed to load departments for filters', err);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getUsers({
        role: selectedRole !== 'ALL' ? (selectedRole as Role) : undefined,
        departmentId: selectedDept !== 'ALL' ? selectedDept : undefined,
        q: searchQuery,
        page,
        pageSize,
      });
      setUsers(response.items);
      setTotalUsers(response.total);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to fetch users';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, selectedDept, searchQuery, page, pageSize]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Open modal
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('STUDENT');
    setFormDeptId(departments[0]?.id || '');
    setFormRollNo('');
    setFormYear(3);
    setFormDivision('A');
    setFormEmpId('');
    setFormDesignation('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormDeptId(user.departmentId || '');
    setFormRollNo(user.rollNo || '');
    setFormYear(user.year || 3);
    setFormDivision(user.division || 'A');
    setFormEmpId(user.employeeId || '');
    setFormDesignation(user.designation || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Toggle user status
  const handleToggleStatus = async (user: User) => {
    try {
      const updated = await userService.toggleUserStatus(user.id);
      dispatch(
        addToast({
          type: updated.isActive ? 'success' : 'warning',
          message: `${user.name} is now ${updated.isActive ? 'Active' : 'Deactivated'}.`,
        })
      );
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to update user status';
      dispatch(addToast({ type: 'error', message: msg }));
    }
  };

  // Form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formName.trim()) errors.name = 'Full name is required';
    if (!formEmail.trim() || !formEmail.includes('@')) {
      errors.email = 'Valid institutional email is required';
    }

    if (formRole === 'STUDENT') {
      if (!formRollNo.trim()) errors.rollNo = 'Roll number is required for students';
    } else if (formRole === 'FACULTY' || formRole === 'HOD') {
      if (!formEmpId.trim()) errors.empId = 'Employee ID is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole,
          departmentId: formDeptId || undefined,
          rollNo: formRole === 'STUDENT' ? formRollNo.trim() : undefined,
          year: formRole === 'STUDENT' ? (formYear as 1 | 2 | 3 | 4) : undefined,
          division: formRole === 'STUDENT' ? formDivision : undefined,
          employeeId: formRole !== 'STUDENT' ? formEmpId.trim() : undefined,
          designation: formRole !== 'STUDENT' ? formDesignation.trim() : undefined,
        });
        dispatch(
          addToast({
            type: 'success',
            message: `User '${formName.trim()}' updated successfully.`,
          })
        );
      } else {
        await userService.createUser({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole,
          departmentId: formDeptId || undefined,
          isActive: true,
          rollNo: formRole === 'STUDENT' ? formRollNo.trim() : undefined,
          year: formRole === 'STUDENT' ? (formYear as 1 | 2 | 3 | 4) : undefined,
          division: formRole === 'STUDENT' ? formDivision : undefined,
          employeeId: formRole !== 'STUDENT' ? formEmpId.trim() : undefined,
          designation: formRole !== 'STUDENT' ? formDesignation.trim() : undefined,
        });
        dispatch(
          addToast({
            type: 'success',
            message: `User '${formName.trim()}' created successfully.`,
          })
        );
      }
      setIsModalOpen(false);
      await loadUsers();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to save user';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock CSV bulk import
  const handleBulkImport = () => {
    setIsImportingCsv(true);
    setTimeout(() => {
      setIsImportingCsv(false);
      setIsCsvModalOpen(false);
      setCsvFileName(null);
      dispatch(
        addToast({
          type: 'success',
          message: 'Bulk CSV imported: 12 student records processed successfully.',
        })
      );
      loadUsers();
    }, 1000);
  };

  const totalPages = Math.ceil(totalUsers / pageSize) || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Directory Management"
        description="Administer institutional users, faculty credentials, student roll allocations, and account access"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCsvModalOpen(true)}
              className="gap-2 shadow-sm text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Bulk Import
            </Button>
            <Button onClick={handleOpenAdd} className="gap-2 shadow-sm text-xs">
              <Plus className="w-4 h-4" /> Add User
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, roll..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="HOD">HOD</option>
                <option value="FACULTY">FACULTY</option>
                <option value="STUDENT">STUDENT</option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Count Metric */}
            <div className="flex items-center justify-end px-2 text-xs font-semibold text-muted-foreground">
              <span>Showing {users.length} of {totalUsers} Users</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Campus Directory</CardTitle>
          <CardDescription>All onboarded university faculty, staff, and student learners</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm text-foreground font-semibold">{error}</p>
              <Button size="sm" variant="outline" onClick={loadUsers} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">No users found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No institutional profiles match your current filter parameters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Academic Context</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {users.map((u) => {
                    const dept = departments.find((d) => d.id === u.departmentId);
                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                            <div>
                              <p className="font-semibold text-foreground">{u.name}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="py-3.5 px-4">
                          {dept ? (
                            <span className="px-2 py-0.5 rounded-md bg-muted font-medium text-[11px] text-foreground">
                              {dept.code}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                          {u.role === 'STUDENT' ? (
                            <span>
                              Roll: <strong className="text-foreground">{u.rollNo || 'N/A'}</strong> | Year {u.year || '—'} Div {u.division || '—'}
                            </span>
                          ) : u.role === 'FACULTY' || u.role === 'HOD' ? (
                            <span>
                              ID: <strong className="text-foreground">{u.employeeId || 'N/A'}</strong> — {u.designation || 'Faculty'}
                            </span>
                          ) : (
                            <span>Institute Oversight</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              u.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                            }`}
                            title="Click to toggle status"
                          >
                            {u.isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit user"
                            aria-label={`Edit ${u.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2 text-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2 text-xs"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit User Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User Profile' : 'Onboard New User'}
        description="Configure account credentials and departmental attributes"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Aryan Sharma or Prof. Neha Kulkarni"
            value={formName}
            onChange={(e) => {
              setFormName(e.target.value);
              if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
            }}
            error={formErrors.name}
          />

          <Input
            label="Institutional Email *"
            type="email"
            placeholder="e.g. user@campus.test"
            value={formEmail}
            onChange={(e) => {
              setFormEmail(e.target.value);
              if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
            }}
            error={formErrors.email}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">
                Institutional Role *
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as Role)}
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="STUDENT">STUDENT</option>
                <option value="FACULTY">FACULTY</option>
                <option value="HOD">HOD</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Department</label>
              <select
                value={formDeptId}
                onChange={(e) => setFormDeptId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">-- None (Institute-wide) --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role-Specific Fields */}
          {formRole === 'STUDENT' && (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-3">
              <h5 className="text-xs font-bold text-foreground">Student Academic Enrollment</h5>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Roll No *"
                  placeholder="e.g. CE301"
                  value={formRollNo}
                  onChange={(e) => setFormRollNo(e.target.value)}
                  error={formErrors.rollNo}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground/80">Year</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground/80">Division</label>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="A">Div A</option>
                    <option value="B">Div B</option>
                    <option value="C">Div C</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {(formRole === 'FACULTY' || formRole === 'HOD') && (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-3">
              <h5 className="text-xs font-bold text-foreground">Faculty Staff Details</h5>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Employee ID *"
                  placeholder="e.g. EMP-CE-05"
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  error={formErrors.empId}
                />
                <Input
                  label="Designation"
                  placeholder="e.g. Associate Professor"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingUser ? 'Save Profile' : 'Create User'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Bulk CSV Import Dialog */}
      <Dialog
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Bulk Import Users (CSV)"
        description="Batch upload student cohorts and faculty rosters via standard CSV template"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 text-center transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs font-semibold text-foreground">
              {csvFileName ? csvFileName : 'Click to select or drag and drop CSV file'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Supported columns: name, email, role, department, rollNo, year, division
            </p>
            <input
              type="file"
              accept=".csv"
              className="mt-3 text-xs text-muted-foreground mx-auto"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setCsvFileName(e.target.files[0].name);
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCsvModalOpen(false)}
              disabled={isImportingCsv}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkImport}
              isLoading={isImportingCsv}
              disabled={!csvFileName}
            >
              Start Import
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default UsersPage;
