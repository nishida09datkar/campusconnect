import { Attachment } from './common';

export interface Reply {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface StreamPost {
  id: string;
  classId: string;
  authorId: string;
  type: 'ANNOUNCEMENT' | 'MATERIAL' | 'DOUBT';
  body: string;
  attachments: Attachment[];
  createdAt: string;
  replies: Reply[];
  resolved?: boolean;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  instructions: string;
  dueAt: string;
  maxMarks: number;
  attachments: Attachment[];
  status?: 'DRAFT' | 'PUBLISHED';
}

export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  files: Attachment[];
  note?: string;
  submittedAt?: string;
  status: SubmissionStatus;
  marks?: number;
  feedback?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  marks: number;
}

export interface Quiz {
  id: string;
  classId: string;
  title: string;
  durationMin: number;
  opensAt: string;
  closesAt: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: number[];
  score: number;
  submittedAt: string;
}

export interface AttendanceEntry {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  entries: AttendanceEntry[];
}
