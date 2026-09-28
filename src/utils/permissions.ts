import { User, Role } from '@/types';
import { db } from '@/api/mock/db';

export type InteractionMode = 'chat' | 'call';

/**
 * Checks whether currentUser is permitted to interact (chat or call) with targetUser.
 * Implements Section 3.2 Interaction Matrix strictly:
 *
 * | From    | To               | Chat | Call | Condition                                                      |
 * |---------|------------------|------|------|----------------------------------------------------------------|
 * | Student | Assigned faculty | Yes  | Yes  | Student is enrolled in a course that faculty is allocated to  |
 * | Student | Other faculty    | No   | No   | Contact does not appear in the list                           |
 * | Student | Classmate        | Yes  | No   | Same class only; group chat allowed                           |
 * | Student | HOD              | Yes  | No   | Same department; text only                                    |
 * | Faculty | Own students     | Yes  | Yes  | Student is enrolled in one of the faculty's classes           |
 * | Faculty | Other faculty    | Yes  | Yes  | Any faculty; group rooms allowed                              |
 * | Faculty | HOD              | Yes  | Yes  | Same department                                               |
 * | HOD     | Dept faculty     | Yes  | Yes  | Own department                                                |
 * | HOD     | Dept students    | Yes  | No   | Own department; mostly via notices                            |
 * | Admin   | Anyone           | Yes  | No   | Announcements and support chat                                |
 */
export function canInteract(
  currentUser: User | null | undefined,
  targetUser: User | null | undefined,
  mode: InteractionMode
): boolean {
  if (!currentUser || !targetUser) return false;
  if (currentUser.id === targetUser.id) return false; // Cannot call or chat with self

  // Inactive users cannot interact
  if (!currentUser.isActive || !targetUser.isActive) return false;

  const fromRole = currentUser.role;
  const toRole = targetUser.role;

  // 1. ADMIN
  // Admin -> Anyone: Chat Yes, Call No
  if (fromRole === 'ADMIN') {
    return mode === 'chat';
  }

  // Target is ADMIN: Anyone -> Admin: Chat Yes, Call No
  if (toRole === 'ADMIN') {
    return mode === 'chat';
  }

  // Helper: check if student is enrolled in any class taught by faculty
  const isStudentEnrolledWithFaculty = (studentId: string, facultyId: string): boolean => {
    // Check classes where facultyId matches and studentIds includes studentId
    return db.classes.some(
      (c) => c.facultyId === facultyId && c.studentIds.includes(studentId)
    );
  };

  // Helper: check if two students share at least one class
  const areStudentsClassmates = (student1Id: string, student2Id: string): boolean => {
    return db.classes.some(
      (c) => c.studentIds.includes(student1Id) && c.studentIds.includes(student2Id)
    );
  };

  // 2. STUDENT
  if (fromRole === 'STUDENT') {
    if (toRole === 'FACULTY') {
      const isAssigned = isStudentEnrolledWithFaculty(currentUser.id, targetUser.id);
      if (!isAssigned) return false;
      return true; // Both chat and call permitted for assigned faculty
    }

    if (toRole === 'STUDENT') {
      const isClassmate = areStudentsClassmates(currentUser.id, targetUser.id);
      if (!isClassmate) return false;
      return mode === 'chat'; // Chat yes, call no
    }

    if (toRole === 'HOD') {
      const sameDept =
        Boolean(currentUser.departmentId) &&
        currentUser.departmentId === targetUser.departmentId;
      if (!sameDept) return false;
      return mode === 'chat'; // Chat yes, call no
    }
  }

  // 3. FACULTY
  if (fromRole === 'FACULTY') {
    if (toRole === 'STUDENT') {
      const isOwnStudent = isStudentEnrolledWithFaculty(targetUser.id, currentUser.id);
      if (!isOwnStudent) return false;
      return true; // Both chat and call permitted
    }

    if (toRole === 'FACULTY') {
      return true; // Any faculty: chat and call allowed
    }

    if (toRole === 'HOD') {
      const sameDept =
        Boolean(currentUser.departmentId) &&
        currentUser.departmentId === targetUser.departmentId;
      if (!sameDept) return false;
      return true; // Same department: both chat and call allowed
    }
  }

  // 4. HOD
  if (fromRole === 'HOD') {
    const sameDept =
      Boolean(currentUser.departmentId) &&
      currentUser.departmentId === targetUser.departmentId;

    if (!sameDept) return false;

    if (toRole === 'FACULTY') {
      return true; // Dept faculty: both chat and call allowed
    }

    if (toRole === 'STUDENT') {
      return mode === 'chat'; // Dept students: chat yes, call no
    }

    if (toRole === 'HOD') {
      return true; // Between HODs: chat and call allowed
    }
  }

  return false;
}

export function hasRole(user: User | null | undefined, allowedRoles: Role[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
