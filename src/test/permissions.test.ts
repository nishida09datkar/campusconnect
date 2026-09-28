import { describe, it, expect } from 'vitest';
import { canInteract } from '@/utils/permissions';
import { db } from '@/api/mock/db';
import { User } from '@/types';

describe('Section 3.2 Interaction Matrix Unit Tests', () => {
  const admin = db.users.find((u) => u.role === 'ADMIN')!;
  const hodCe = db.users.find((u) => u.id === 'user-hod-ce')!;
  const hodIt = db.users.find((u) => u.id === 'user-hod-it')!;
  const facNeha = db.users.find((u) => u.id === 'user-fac-neha')!; // CE, teaches Web Dev
  const facVivek = db.users.find((u) => u.id === 'user-fac-vivek')!; // IT, teaches Networks
  const stu1 = db.users.find((u) => u.id === 'user-stu-1')!; // CE, enrolled in Web Dev with Neha
  const stu2 = db.users.find((u) => u.id === 'user-stu-2')!; // CE, enrolled in Web Dev with Neha (classmate of stu1)
  const stu5 = db.users.find((u) => u.id === 'user-stu-5')!; // CE Year 3 Div B (NOT in Neha's class)
  const stu12 = db.users.find((u) => u.id === 'user-stu-12')!; // IT Year 2 (NOT in Vivek's Networks class)

  it('Row 1: Student -> Assigned faculty (Chat: Yes, Call: Yes)', () => {
    expect(canInteract(stu1, facNeha, 'chat')).toBe(true);
    expect(canInteract(stu1, facNeha, 'call')).toBe(true);
  });

  it('Row 2: Student -> Other faculty (Chat: No, Call: No)', () => {
    // stu5 is in CE-B, not enrolled in Neha's class
    expect(canInteract(stu5, facNeha, 'chat')).toBe(false);
    expect(canInteract(stu5, facNeha, 'call')).toBe(false);

    // stu12 is in IT, not enrolled in Vivek's Networks class
    expect(canInteract(stu12, facVivek, 'chat')).toBe(false);
    expect(canInteract(stu12, facVivek, 'call')).toBe(false);
  });

  it('Row 3: Student -> Classmate (Chat: Yes, Call: No)', () => {
    // stu1 and stu2 are in the same Web Dev class
    expect(canInteract(stu1, stu2, 'chat')).toBe(true);
    expect(canInteract(stu1, stu2, 'call')).toBe(false);

    // stu1 and stu5 are in different classes
    expect(canInteract(stu1, stu5, 'chat')).toBe(false);
    expect(canInteract(stu1, stu5, 'call')).toBe(false);
  });

  it('Row 4: Student -> HOD (Same department: Chat: Yes, Call: No; Other department: No)', () => {
    // stu1 is CE, hodCe is CE
    expect(canInteract(stu1, hodCe, 'chat')).toBe(true);
    expect(canInteract(stu1, hodCe, 'call')).toBe(false);

    // stu1 is CE, hodIt is IT
    expect(canInteract(stu1, hodIt, 'chat')).toBe(false);
    expect(canInteract(stu1, hodIt, 'call')).toBe(false);
  });

  it('Row 5: Faculty -> Own students (Chat: Yes, Call: Yes)', () => {
    expect(canInteract(facNeha, stu1, 'chat')).toBe(true);
    expect(canInteract(facNeha, stu1, 'call')).toBe(true);

    // Not own student
    expect(canInteract(facNeha, stu5, 'chat')).toBe(false);
    expect(canInteract(facNeha, stu5, 'call')).toBe(false);
  });

  it('Row 6: Faculty -> Other faculty (Chat: Yes, Call: Yes for any faculty)', () => {
    expect(canInteract(facNeha, facVivek, 'chat')).toBe(true);
    expect(canInteract(facNeha, facVivek, 'call')).toBe(true);
  });

  it('Row 7: Faculty -> HOD (Same department: Chat: Yes, Call: Yes; Other dept: No)', () => {
    // Neha is CE, hodCe is CE
    expect(canInteract(facNeha, hodCe, 'chat')).toBe(true);
    expect(canInteract(facNeha, hodCe, 'call')).toBe(true);

    // Neha is CE, hodIt is IT
    expect(canInteract(facNeha, hodIt, 'chat')).toBe(false);
    expect(canInteract(facNeha, hodIt, 'call')).toBe(false);
  });

  it('Row 8: HOD -> Dept faculty (Chat: Yes, Call: Yes)', () => {
    expect(canInteract(hodCe, facNeha, 'chat')).toBe(true);
    expect(canInteract(hodCe, facNeha, 'call')).toBe(true);

    // HOD CE -> IT faculty: No
    expect(canInteract(hodCe, facVivek, 'chat')).toBe(false);
    expect(canInteract(hodCe, facVivek, 'call')).toBe(false);
  });

  it('Row 9: HOD -> Dept students (Chat: Yes, Call: No)', () => {
    // hodCe -> stu1 (CE): Chat Yes, Call No
    expect(canInteract(hodCe, stu1, 'chat')).toBe(true);
    expect(canInteract(hodCe, stu1, 'call')).toBe(false);

    // hodCe -> stu12 (IT): No
    expect(canInteract(hodCe, stu12, 'chat')).toBe(false);
    expect(canInteract(hodCe, stu12, 'call')).toBe(false);
  });

  it('Row 10: Admin -> Anyone (Chat: Yes, Call: No)', () => {
    expect(canInteract(admin, stu1, 'chat')).toBe(true);
    expect(canInteract(admin, stu1, 'call')).toBe(false);

    expect(canInteract(admin, facNeha, 'chat')).toBe(true);
    expect(canInteract(admin, facNeha, 'call')).toBe(false);

    expect(canInteract(admin, hodCe, 'chat')).toBe(true);
    expect(canInteract(admin, hodCe, 'call')).toBe(false);
  });

  it('Edge case: User cannot interact with themselves', () => {
    expect(canInteract(stu1, stu1, 'chat')).toBe(false);
    expect(canInteract(stu1, stu1, 'call')).toBe(false);
  });

  it('Edge case: Deactivated users cannot interact', () => {
    const inactiveUser: User = { ...stu1, id: 'inactive-stu', isActive: false };
    expect(canInteract(inactiveUser, facNeha, 'chat')).toBe(false);
    expect(canInteract(facNeha, inactiveUser, 'chat')).toBe(false);
  });
});
