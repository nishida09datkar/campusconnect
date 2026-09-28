import { Role } from '@/types';

export const DEMO_ACCOUNTS: { role: Role; label: string; email: string; pass: string; name: string; desc: string }[] = [
  {
    role: 'ADMIN',
    label: 'Institute Admin',
    email: 'admin@campus.test',
    pass: 'Admin@123',
    name: 'Aarav Mehta',
    desc: 'Full campus oversight, department & user management',
  },
  {
    role: 'HOD',
    label: 'Head of Dept (CE)',
    email: 'hod.ce@campus.test',
    pass: 'Hod@123',
    name: 'Dr. Kavita Rao',
    desc: 'CE department head, course allocation & notices',
  },
  {
    role: 'FACULTY',
    label: 'Faculty (Web Dev)',
    email: 'neha@campus.test',
    pass: 'Fac@123',
    name: 'Prof. Neha Kulkarni',
    desc: 'Teaches Web Dev CE-A, assigns work, answers doubts',
  },
  {
    role: 'STUDENT',
    label: 'Student (CE Year 3)',
    email: 'student1@campus.test',
    pass: 'Stu@123',
    name: 'Aryan Sharma',
    desc: 'Enrolled in CE-A Web Dev, asks doubts, submits work',
  },
];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  HOD: 'Head of Department',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
};

export const ROLE_COLORS: Record<Role, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  HOD: { bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  FACULTY: { bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  STUDENT: { bg: 'bg-sky-100 dark:bg-sky-950/60', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
};
