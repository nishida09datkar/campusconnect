export interface ActivityPoint {
  day: string;
  messages: number;
  calls: number;
}

export interface AdminAnalytics {
  totalDepartments: number;
  totalFaculty: number;
  totalStudents: number;
  activeClasses: number;
  callsThisWeek: number;
  messagesThisWeek: number;
  weeklyActivity: ActivityPoint[];
  userDistribution: Record<string, number>;
}

export interface FacultyWorkload {
  facultyId: string;
  facultyName: string;
  classesCount: number;
  studentCount: number;
}

export interface AttendanceTrend {
  dateOrWeek: string;
  attendancePercentage: number;
}

export interface HodAnalytics {
  departmentId: string;
  departmentName: string;
  submissionRate: number;
  facultyWorkload: FacultyWorkload[];
  attendanceTrend: AttendanceTrend[];
}

export interface ClassGradingProgress {
  classId: string;
  className: string;
  gradedSubmissions: number;
  pendingSubmissions: number;
  totalSubmissions: number;
}

export interface ClassAttendanceRecord {
  classId: string;
  className: string;
  averageAttendance: number;
  totalSessions: number;
}

export interface FacultyAnalytics {
  facultyId: string;
  gradingProgress: ClassGradingProgress[];
  attendanceHistory: ClassAttendanceRecord[];
}

export interface GradePoint {
  assessmentTitle: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  date: string;
}

export interface SubmissionHistoryItem {
  assignmentTitle: string;
  className: string;
  submittedAt: string;
  status: string;
  onTime: boolean;
}

export interface StudentAnalytics {
  studentId: string;
  overallAttendancePercentage: number;
  presentSessions: number;
  totalSessions: number;
  gradesOverTime: GradePoint[];
  submissionHistory: SubmissionHistoryItem[];
}
