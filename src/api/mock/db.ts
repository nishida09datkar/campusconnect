import {
  User,
  Department,
  Course,
  ClassRoom,
  FacultyAllocation,
  Enrollment,
  StreamPost,
  Assignment,
  Submission,
  Material,
  Quiz,
  QuizAttempt,
  AttendanceRecord,
  Announcement,
  Conversation,
  Message,
  CallLog,
  AppNotification,
  CalendarEvent,
} from '@/types';

// Initial Departments
export const initialDepartments: Department[] = [
  { id: 'dept-ce', name: 'Computer Engineering', code: 'CE', hodId: 'user-hod-ce' },
  { id: 'dept-it', name: 'Information Technology', code: 'IT', hodId: 'user-hod-it' },
];

// Initial Users
export const initialUsers: User[] = [
  // Admin
  {
    id: 'user-admin',
    name: 'Aarav Mehta',
    email: 'admin@campus.test',
    role: 'ADMIN',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    designation: 'Chief Administrator',
  },
  // HODs
  {
    id: 'user-hod-ce',
    name: 'Dr. Kavita Rao',
    email: 'hod.ce@campus.test',
    role: 'HOD',
    departmentId: 'dept-ce',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    employeeId: 'EMP-CE-01',
    designation: 'Professor & Head of CE',
  },
  {
    id: 'user-hod-it',
    name: 'Dr. Sameer Joshi',
    email: 'hod.it@campus.test',
    role: 'HOD',
    departmentId: 'dept-it',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    employeeId: 'EMP-IT-01',
    designation: 'Professor & Head of IT',
  },
  // Faculty
  {
    id: 'user-fac-neha',
    name: 'Prof. Neha Kulkarni',
    email: 'neha@campus.test',
    role: 'FACULTY',
    departmentId: 'dept-ce',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580894732454-defa56a64426?w=150',
    employeeId: 'EMP-CE-02',
    designation: 'Associate Professor',
  },
  {
    id: 'user-fac-rohan',
    name: 'Prof. Rohan Desai',
    email: 'rohan@campus.test',
    role: 'FACULTY',
    departmentId: 'dept-ce',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    employeeId: 'EMP-CE-03',
    designation: 'Assistant Professor',
  },
  {
    id: 'user-fac-anita',
    name: 'Prof. Anita Patil',
    email: 'anita@campus.test',
    role: 'FACULTY',
    departmentId: 'dept-ce',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    employeeId: 'EMP-CE-04',
    designation: 'Assistant Professor',
  },
  {
    id: 'user-fac-vivek',
    name: 'Prof. Vivek Shah',
    email: 'vivek@campus.test',
    role: 'FACULTY',
    departmentId: 'dept-it',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    employeeId: 'EMP-IT-02',
    designation: 'Associate Professor',
  },
  {
    id: 'user-fac-sara',
    name: 'Prof. Sara Khan',
    email: 'sara@campus.test',
    role: 'FACULTY',
    departmentId: 'dept-it',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    employeeId: 'EMP-IT-03',
    designation: 'Assistant Professor',
  },
  // Students (CE Year 3)
  {
    id: 'user-stu-1',
    name: 'Aryan Sharma',
    email: 'student1@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-ce',
    isActive: true,
    rollNo: 'CE301',
    year: 3,
    division: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  },
  {
    id: 'user-stu-2',
    name: 'Diya Patel',
    email: 'student2@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-ce',
    isActive: true,
    rollNo: 'CE302',
    year: 3,
    division: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  },
  {
    id: 'user-stu-3',
    name: 'Ishaan Verma',
    email: 'student3@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-ce',
    isActive: true,
    rollNo: 'CE303',
    year: 3,
    division: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
  },
  {
    id: 'user-stu-4',
    name: 'Ananya Iyer',
    email: 'student4@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-ce',
    isActive: true,
    rollNo: 'CE304',
    year: 3,
    division: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
  },
  {
    id: 'user-stu-5',
    name: 'Rohan Gupta',
    email: 'student5@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-ce',
    isActive: true,
    rollNo: 'CE305',
    year: 3,
    division: 'B',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
  },
  {
    id: 'user-stu-6',
    name: 'Sneha Nair',
    email: 'student6@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-ce',
    isActive: true,
    rollNo: 'CE306',
    year: 3,
    division: 'B',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    id: 'user-stu-7',
    name: 'Siddharth Joshi',
    email: 'student7@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-ce',
    isActive: true,
    rollNo: 'CE307',
    year: 3,
    division: 'B',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
  },
  {
    id: 'user-stu-8',
    name: 'Tanvi Deshmukh',
    email: 'student8@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-ce',
    isActive: true,
    rollNo: 'CE308',
    year: 3,
    division: 'B',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  },
  // Students (IT Year 2)
  {
    id: 'user-stu-9',
    name: 'Kabir Mehta',
    email: 'student9@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-it',
    isActive: true,
    rollNo: 'IT201',
    year: 2,
    division: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150',
  },
  {
    id: 'user-stu-10',
    name: 'Pooja Reddy',
    email: 'student10@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-it',
    isActive: true,
    rollNo: 'IT202',
    year: 2,
    division: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
  },
  {
    id: 'user-stu-11',
    name: 'Aditya Kulkarni',
    email: 'student11@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-it',
    isActive: true,
    rollNo: 'IT203',
    year: 2,
    division: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
  },
  {
    id: 'user-stu-12',
    name: 'Riya Sen',
    email: 'student12@campus.test',
    role: 'STUDENT',
    departmentId: 'dept-it',
    isActive: true,
    rollNo: 'IT204',
    year: 2,
    division: 'A',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
];

// Initial Courses
export const initialCourses: Course[] = [
  { id: 'course-ce-301', code: 'CE301', title: 'Web Development', departmentId: 'dept-ce', year: 3 },
  { id: 'course-ce-302', code: 'CE302', title: 'Database Systems', departmentId: 'dept-ce', year: 3 },
  { id: 'course-ce-303', code: 'CE303', title: 'Java and Spring Framework', departmentId: 'dept-ce', year: 3 },
  { id: 'course-it-201', code: 'IT201', title: 'Computer Networks', departmentId: 'dept-it', year: 2 },
  { id: 'course-it-202', code: 'IT202', title: 'Data Structures and Algorithms', departmentId: 'dept-it', year: 2 },
];

// Initial Faculty Allocations
export const initialAllocations: FacultyAllocation[] = [
  { id: 'alloc-1', facultyId: 'user-fac-neha', courseId: 'course-ce-301' },
  { id: 'alloc-2', facultyId: 'user-fac-rohan', courseId: 'course-ce-302' },
  { id: 'alloc-3', facultyId: 'user-fac-anita', courseId: 'course-ce-303' },
  { id: 'alloc-4', facultyId: 'user-fac-vivek', courseId: 'course-it-201' },
  { id: 'alloc-5', facultyId: 'user-fac-sara', courseId: 'course-it-202' },
];

// Initial Classrooms
export const initialClasses: ClassRoom[] = [
  {
    id: 'class-1',
    courseId: 'course-ce-301',
    title: 'Web Development (CE-A)',
    section: 'A',
    classCode: 'WEB3A1',
    facultyId: 'user-fac-neha',
    studentIds: ['user-stu-1', 'user-stu-2', 'user-stu-3', 'user-stu-4'],
    coverColor: 'from-indigo-600 to-purple-600',
  },
  {
    id: 'class-2',
    courseId: 'course-ce-302',
    title: 'Database Systems (CE-A)',
    section: 'A',
    classCode: 'DBS3A2',
    facultyId: 'user-fac-rohan',
    studentIds: ['user-stu-1', 'user-stu-2', 'user-stu-3', 'user-stu-4'],
    coverColor: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'class-3',
    courseId: 'course-ce-303',
    title: 'Java and Spring (CE-B)',
    section: 'B',
    classCode: 'JAV3B1',
    facultyId: 'user-fac-anita',
    studentIds: ['user-stu-5', 'user-stu-6', 'user-stu-7', 'user-stu-8'],
    coverColor: 'from-amber-600 to-orange-600',
  },
  {
    id: 'class-4',
    courseId: 'course-it-201',
    title: 'Computer Networks (IT-A)',
    section: 'A',
    classCode: 'NET2A1',
    facultyId: 'user-fac-vivek',
    studentIds: ['user-stu-9', 'user-stu-10', 'user-stu-11'],
    coverColor: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'class-5',
    courseId: 'course-it-202',
    title: 'Data Structures (IT-A)',
    section: 'A',
    classCode: 'DSA2A1',
    facultyId: 'user-fac-sara',
    studentIds: ['user-stu-9', 'user-stu-10', 'user-stu-11', 'user-stu-12'],
    coverColor: 'from-rose-600 to-pink-600',
  },
];

// Initial Enrollments
export const initialEnrollments: Enrollment[] = [
  // Class 1
  { id: 'enr-1', studentId: 'user-stu-1', classId: 'class-1' },
  { id: 'enr-2', studentId: 'user-stu-2', classId: 'class-1' },
  { id: 'enr-3', studentId: 'user-stu-3', classId: 'class-1' },
  { id: 'enr-4', studentId: 'user-stu-4', classId: 'class-1' },
  // Class 2
  { id: 'enr-5', studentId: 'user-stu-1', classId: 'class-2' },
  { id: 'enr-6', studentId: 'user-stu-2', classId: 'class-2' },
  { id: 'enr-7', studentId: 'user-stu-3', classId: 'class-2' },
  { id: 'enr-8', studentId: 'user-stu-4', classId: 'class-2' },
  // Class 3
  { id: 'enr-9', studentId: 'user-stu-5', classId: 'class-3' },
  { id: 'enr-10', studentId: 'user-stu-6', classId: 'class-3' },
  { id: 'enr-11', studentId: 'user-stu-7', classId: 'class-3' },
  { id: 'enr-12', studentId: 'user-stu-8', classId: 'class-3' },
  // Class 4
  { id: 'enr-13', studentId: 'user-stu-9', classId: 'class-4' },
  { id: 'enr-14', studentId: 'user-stu-10', classId: 'class-4' },
  { id: 'enr-15', studentId: 'user-stu-11', classId: 'class-4' },
  // Class 5
  { id: 'enr-16', studentId: 'user-stu-9', classId: 'class-5' },
  { id: 'enr-17', studentId: 'user-stu-10', classId: 'class-5' },
  { id: 'enr-18', studentId: 'user-stu-11', classId: 'class-5' },
  { id: 'enr-19', studentId: 'user-stu-12', classId: 'class-5' },
];

// Initial Stream Posts & Doubts
export const initialStreamPosts: StreamPost[] = [
  {
    id: 'post-1',
    classId: 'class-1',
    authorId: 'user-fac-neha',
    type: 'ANNOUNCEMENT',
    body: 'Welcome to Web Development CE-A! Please review the syllabus and setup your VS Code with Node 20+.',
    attachments: [
      { id: 'att-1', name: 'WebDev_Syllabus_2026.pdf', sizeKb: 340, mime: 'application/pdf', url: '#' },
    ],
    createdAt: '2026-09-20T09:00:00Z',
    replies: [
      { id: 'rep-1', authorId: 'user-stu-1', body: 'Excited for this course ma’am!', createdAt: '2026-09-20T09:30:00Z' },
    ],
  },
  {
    id: 'post-2',
    classId: 'class-1',
    authorId: 'user-stu-1',
    type: 'DOUBT',
    body: 'Prof. Neha, could you clarify whether we should use React Router v6 createBrowserRouter or standard BrowserRouter for nested routes in the lab assignment?',
    attachments: [],
    createdAt: '2026-09-22T14:15:00Z',
    resolved: false,
    replies: [
      { id: 'rep-2', authorId: 'user-fac-neha', body: 'Either is acceptable, but createBrowserRouter with data routers is recommended for Unit V topics.', createdAt: '2026-09-22T15:00:00Z' },
    ],
  },
  {
    id: 'post-3',
    classId: 'class-1',
    authorId: 'user-stu-2',
    type: 'DOUBT',
    body: 'How do we handle TypeScript generic props in compound tabs component?',
    attachments: [],
    createdAt: '2026-09-21T11:00:00Z',
    resolved: true,
    replies: [
      { id: 'rep-3', authorId: 'user-fac-neha', body: 'Pass <T extends string> to the TabsContext. Refer to Chapter 4 slides attached.', createdAt: '2026-09-21T11:45:00Z' },
    ],
  },
  {
    id: 'post-4',
    classId: 'class-1',
    authorId: 'user-fac-neha',
    type: 'MATERIAL',
    body: 'Lecture 1 & 2 slides on React Component Lifecycle, Hooks, and TypeScript Interfaces.',
    attachments: [
      { id: 'att-2', name: 'Lecture_React_Basics.pdf', sizeKb: 1240, mime: 'application/pdf', url: '#' },
    ],
    createdAt: '2026-09-23T10:00:00Z',
    replies: [],
  },
];

// Initial Assignments
export const initialAssignments: Assignment[] = [
  {
    id: 'assign-1',
    classId: 'class-1',
    title: 'Lab 1: React Component Hierarchy & State Lifting',
    instructions: 'Build a task board with state lifted up to the parent App component. Implement filter tabs and full TypeScript prop typing.',
    dueAt: '2026-09-25T23:59:00Z', // past due
    maxMarks: 25,
    status: 'PUBLISHED',
    attachments: [
      { id: 'att-lab1', name: 'Lab1_Specification.pdf', sizeKb: 210, mime: 'application/pdf', url: '#' },
    ],
  },
  {
    id: 'assign-2',
    classId: 'class-1',
    title: 'Lab 2: Redux Toolkit Store with Entity Adapter',
    instructions: 'Create a normalized store slice for posts with optimistic updates and custom thunks. Integrate Redux DevTools.',
    dueAt: '2026-10-05T23:59:00Z', // upcoming
    maxMarks: 50,
    status: 'PUBLISHED',
    attachments: [],
  },
];

// Initial Submissions
export const initialSubmissions: Submission[] = [
  {
    id: 'sub-1',
    assignmentId: 'assign-1',
    studentId: 'user-stu-1',
    files: [
      { id: 'att-s1', name: 'Aryan_Lab1_Code.zip', sizeKb: 520, mime: 'application/zip', url: '#' },
    ],
    note: 'Completed all mandatory and bonus test cases.',
    submittedAt: '2026-09-24T18:30:00Z',
    status: 'GRADED',
    marks: 24,
    feedback: 'Excellent work Aryan! Well-structured components and clean typing.',
  },
  {
    id: 'sub-2',
    assignmentId: 'assign-1',
    studentId: 'user-stu-2',
    files: [
      { id: 'att-s2', name: 'Diya_Lab1_Submission.zip', sizeKb: 480, mime: 'application/zip', url: '#' },
    ],
    note: 'Included unit test report.',
    submittedAt: '2026-09-25T21:00:00Z',
    status: 'SUBMITTED',
  },
];

// Initial Quizzes
export const initialQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    classId: 'class-1',
    title: 'Quiz 1: React Fundamentals & Hooks',
    durationMin: 15,
    opensAt: '2026-09-20T00:00:00Z',
    closesAt: '2026-10-10T23:59:00Z',
    questions: [
      {
        id: 'q-1',
        text: 'Which hook should be used to synchronize with external state outside React?',
        options: ['useState', 'useSyncExternalStore', 'useReducer', 'useId'],
        correctIndex: 1,
        marks: 2,
      },
      {
        id: 'q-2',
        text: 'What does TypeScript strict mode enforce regarding uninitialized variables?',
        options: ['Implicit any is allowed', 'Strict null checks are enabled', 'Interfaces are optional', 'Enums must be numeric'],
        correctIndex: 1,
        marks: 2,
      },
      {
        id: 'q-3',
        text: 'In Redux Toolkit, createSlice automatically uses which library under the hood for immutable updates?',
        options: ['Lodash', 'Immer', 'Immutable.js', 'Ramda'],
        correctIndex: 1,
        marks: 2,
      },
      {
        id: 'q-4',
        text: 'What is the primary difference between useMemo and useCallback?',
        options: [
          'useMemo memoizes values, useCallback memoizes functions',
          'useCallback runs before render, useMemo runs after',
          'useMemo is only for DOM elements',
          'There is no difference'
        ],
        correctIndex: 0,
        marks: 2,
      },
      {
        id: 'q-5',
        text: 'Which WebRTC API interface manages the peer connection lifecycle and ICE candidate exchange?',
        options: ['MediaStreamTrack', 'RTCPeerConnection', 'RTCDataChannel', 'RTCConfiguration'],
        correctIndex: 1,
        marks: 2,
      },
    ],
  },
];

export const initialQuizAttempts: QuizAttempt[] = [
  {
    id: 'attempt-1',
    quizId: 'quiz-1',
    studentId: 'user-stu-1',
    answers: [1, 1, 1, 0, 1],
    score: 10,
    submittedAt: '2026-09-22T16:00:00Z',
  },
];

// Initial Attendance
export const initialAttendance: AttendanceRecord[] = [
  {
    id: 'att-rec-1',
    classId: 'class-1',
    date: '2026-09-18',
    entries: [
      { studentId: 'user-stu-1', status: 'PRESENT' },
      { studentId: 'user-stu-2', status: 'PRESENT' },
      { studentId: 'user-stu-3', status: 'PRESENT' },
      { studentId: 'user-stu-4', status: 'ABSENT' },
    ],
  },
  {
    id: 'att-rec-2',
    classId: 'class-1',
    date: '2026-09-21',
    entries: [
      { studentId: 'user-stu-1', status: 'PRESENT' },
      { studentId: 'user-stu-2', status: 'PRESENT' },
      { studentId: 'user-stu-3', status: 'LATE' },
      { studentId: 'user-stu-4', status: 'PRESENT' },
    ],
  },
  {
    id: 'att-rec-3',
    classId: 'class-1',
    date: '2026-09-23',
    entries: [
      { studentId: 'user-stu-1', status: 'PRESENT' },
      { studentId: 'user-stu-2', status: 'PRESENT' },
      { studentId: 'user-stu-3', status: 'PRESENT' },
      { studentId: 'user-stu-4', status: 'PRESENT' },
    ],
  },
  {
    id: 'att-rec-4',
    classId: 'class-1',
    date: '2026-09-25',
    entries: [
      { studentId: 'user-stu-1', status: 'PRESENT' },
      { studentId: 'user-stu-2', status: 'ABSENT' },
      { studentId: 'user-stu-3', status: 'PRESENT' },
      { studentId: 'user-stu-4', status: 'PRESENT' },
    ],
  },
];

// Initial Announcements / Notices
export const initialAnnouncements: Announcement[] = [
  {
    id: 'notice-1',
    senderId: 'user-admin',
    audience: 'ALL',
    title: 'Academic Calendar AY 2026-27 Announced',
    body: 'The comprehensive academic calendar including midterm assessments, technical symposiums, and term-end evaluations has been published.',
    createdAt: '2026-09-15T08:00:00Z',
  },
  {
    id: 'notice-2',
    senderId: 'user-hod-ce',
    departmentId: 'dept-ce',
    audience: 'FACULTY',
    title: 'Department Faculty Meeting — Curriculum Review',
    body: 'All Computer Engineering faculty are requested to assemble in Seminar Hall B this Friday at 3:30 PM for the upcoming syllabus audit.',
    createdAt: '2026-09-22T10:30:00Z',
  },
  {
    id: 'notice-3',
    senderId: 'user-hod-ce',
    departmentId: 'dept-ce',
    audience: 'STUDENTS',
    year: 3,
    title: 'Pre-Placement Training & Mock Coding Challenge',
    body: 'Third-year CE students are eligible to enroll for the weekend LeetCode and System Design preparatory bootcamp.',
    createdAt: '2026-09-24T12:00:00Z',
  },
];

// Initial Conversations & Messages
export const initialMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-stu-1',
    body: 'Good afternoon Prof. Neha! Had a quick question regarding the Lab 2 rubric.',
    attachments: [],
    sentAt: '2026-09-26T14:20:00Z',
    status: 'READ',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'user-fac-neha',
    body: 'Good afternoon Aryan! Feel free to ask here, or request a quick voice call if you need screen sharing.',
    attachments: [],
    sentAt: '2026-09-26T14:22:00Z',
    status: 'READ',
  },
  {
    id: 'msg-3',
    conversationId: 'conv-2',
    senderId: 'user-fac-neha',
    body: 'Dr. Rao, the Web Development course plan for Unit II has been completed ahead of schedule.',
    attachments: [],
    sentAt: '2026-09-25T11:00:00Z',
    status: 'READ',
  },
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    senderId: 'user-hod-ce',
    body: 'Great progress Prof. Neha. Please prepare the question bank for Unit Test 1 by next week.',
    attachments: [],
    sentAt: '2026-09-25T11:30:00Z',
    status: 'READ',
  },
];

export const initialConversations: Conversation[] = [
  {
    id: 'conv-1',
    type: 'DIRECT',
    memberIds: ['user-stu-1', 'user-fac-neha'],
    lastMessage: initialMessages[1],
    unreadCount: 0,
  },
  {
    id: 'conv-2',
    type: 'DIRECT',
    memberIds: ['user-fac-neha', 'user-hod-ce'],
    lastMessage: initialMessages[3],
    unreadCount: 0,
  },
  {
    id: 'conv-3',
    type: 'GROUP',
    name: 'CE-A Student Study Group',
    memberIds: ['user-stu-1', 'user-stu-2', 'user-stu-3', 'user-stu-4'],
    unreadCount: 1,
    lastMessage: {
      id: 'msg-group-1',
      conversationId: 'conv-3',
      senderId: 'user-stu-2',
      body: 'Has everyone finished question 4 of the lab assignment?',
      attachments: [],
      sentAt: '2026-09-27T18:00:00Z',
      status: 'DELIVERED',
    },
  },
];

// Initial Call Logs
export const initialCallLogs: CallLog[] = [
  {
    id: 'call-1',
    callerId: 'user-stu-1',
    calleeId: 'user-fac-neha',
    kind: 'VIDEO',
    startedAt: '2026-09-24T15:30:00Z',
    endedAt: '2026-09-24T15:42:15Z',
    durationSec: 735,
    outcome: 'COMPLETED',
  },
  {
    id: 'call-2',
    callerId: 'user-stu-2',
    calleeId: 'user-fac-neha',
    kind: 'VOICE',
    startedAt: '2026-09-25T10:00:00Z',
    endedAt: '2026-09-25T10:00:30Z',
    outcome: 'DECLINED',
  },
];

// Initial Notifications
export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'user-stu-1',
    type: 'ASSIGNMENT',
    title: 'New Assignment Posted',
    body: 'Prof. Neha Kulkarni posted Lab 2: Redux Toolkit Store.',
    link: '/student/classes/class-1',
    read: false,
    createdAt: '2026-09-26T09:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'user-stu-1',
    type: 'GRADE',
    title: 'Assignment Graded',
    body: 'Your submission for Lab 1 was graded (24/25).',
    link: '/student/classes/class-1',
    read: true,
    createdAt: '2026-09-25T19:00:00Z',
  },
  {
    id: 'notif-3',
    userId: 'user-fac-neha',
    type: 'NOTICE',
    title: 'Department Faculty Meeting',
    body: 'Dr. Kavita Rao posted a new notice for CE Faculty.',
    link: '/notifications',
    read: false,
    createdAt: '2026-09-22T10:35:00Z',
  },
];

// Initial Course Study Materials
export const initialMaterials: Material[] = [
  {
    id: 'mat-1',
    classId: 'class-1',
    title: 'Unit 1: Modern JavaScript & ESNext Features',
    description: 'Reference notes and cheat sheet covering arrow functions, destructuring, promises, and async/await.',
    attachments: [
      { id: 'att-m1', name: 'Unit1_ESNext_Reference.pdf', sizeKb: 840, mime: 'application/pdf', url: '#' },
    ],
    uploadedAt: '2026-09-18T10:00:00Z',
    authorId: 'user-fac-neha',
  },
  {
    id: 'mat-2',
    classId: 'class-1',
    title: 'Unit 2: React Component Architecture & Custom Hooks',
    description: 'Lecture slides on custom hooks, memoization with useMemo/useCallback, and Context API.',
    attachments: [
      { id: 'att-m2', name: 'React_Hooks_DeepDive.pdf', sizeKb: 1450, mime: 'application/pdf', url: '#' },
    ],
    uploadedAt: '2026-09-22T14:30:00Z',
    authorId: 'user-fac-neha',
  },
  {
    id: 'mat-3',
    classId: 'class-2',
    title: 'Relational Algebra & Normalization Cheatsheet',
    description: 'Complete examples of 1NF through BCNF with functional dependency proofs.',
    attachments: [
      { id: 'att-m3', name: 'Database_Normalization.pdf', sizeKb: 620, mime: 'application/pdf', url: '#' },
    ],
    uploadedAt: '2026-09-20T11:00:00Z',
    authorId: 'user-fac-rohan',
  },
];

// Initial Calendar Events & Meetings
export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'CE Department Curriculum Review Meeting',
    description: 'Discussion on Unit 3 syllabus coverage, lab benchmarks, and upcoming midterm evaluations.',
    startTime: '2026-10-08T10:00:00Z',
    endTime: '2026-10-08T11:30:00Z',
    type: 'MEETING',
    creatorId: 'user-hod-ce',
    departmentId: 'dept-ce',
    participantIds: ['user-hod-ce', 'user-fac-neha', 'user-fac-rohan', 'user-fac-anita'],
    location: 'Seminar Hall B & Virtual Meet Room',
  },
  {
    id: 'evt-2',
    title: 'Lab 2: Redux Toolkit Store Submission',
    description: 'Submission deadline for Web Development Lab 2 (CE301).',
    startTime: '2026-10-09T23:59:00Z',
    endTime: '2026-10-09T23:59:00Z',
    type: 'ASSIGNMENT',
    creatorId: 'user-fac-neha',
    classId: 'class-1',
    link: '/student/classes/class-1',
  },
  {
    id: 'evt-3',
    title: 'Live Lecture: React Hooks & State Machines',
    description: 'Interactive session on custom hooks, performance tuning, and memoization patterns.',
    startTime: '2026-10-10T09:30:00Z',
    endTime: '2026-10-10T10:45:00Z',
    type: 'LECTURE',
    creatorId: 'user-fac-neha',
    classId: 'class-1',
    link: '/lecture/room-ce-301',
  },
  {
    id: 'evt-4',
    title: 'MCQ Assessment: Database Normalization',
    description: 'Online timed quiz covering 1NF, 2NF, 3NF, and BCNF normalization algorithms.',
    startTime: '2026-10-12T14:00:00Z',
    endTime: '2026-10-12T15:00:00Z',
    type: 'QUIZ',
    creatorId: 'user-fac-rohan',
    classId: 'class-2',
    link: '/student/classes/class-2',
  },
  {
    id: 'evt-5',
    title: 'Annual Campus Technical Symposium & Hackathon',
    description: 'Institute-wide 24hr project marathon open to all departments.',
    startTime: '2026-10-15T09:00:00Z',
    endTime: '2026-10-16T17:00:00Z',
    type: 'EVENT',
    creatorId: 'user-admin',
    location: 'Campus Auditorium & Tech Park',
  },
];

const loadFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`campusconnect_db_${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, data: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`campusconnect_db_${key}`, JSON.stringify(data));
  } catch {
    // Ignore quota issues
  }
};

// Live Database Store (mutable arrays backed by localStorage for multi-session sync)
class MockDatabase {
  users = [...initialUsers];
  departments = [...initialDepartments];
  courses = [...initialCourses];
  allocations = [...initialAllocations];
  classes = [...initialClasses];
  enrollments = [...initialEnrollments];
  streamPosts = loadFromStorage('streamPosts', [...initialStreamPosts]);
  assignments = [...initialAssignments];
  submissions = [...initialSubmissions];
  materials = [...initialMaterials];
  quizzes = [...initialQuizzes];
  quizAttempts = [...initialQuizAttempts];
  attendance = [...initialAttendance];
  announcements = [...initialAnnouncements];
  conversations = loadFromStorage('conversations', [...initialConversations]);
  messages = loadFromStorage('messages', [...initialMessages]);
  callLogs = [...initialCallLogs];
  notifications = loadFromStorage('notifications', [...initialNotifications]);
  events = [...initialCalendarEvents];

  persistMessages(): void {
    saveToStorage('messages', this.messages);
    saveToStorage('conversations', this.conversations);
  }

  persistStream(): void {
    saveToStorage('streamPosts', this.streamPosts);
  }

  persistNotifications(): void {
    saveToStorage('notifications', this.notifications);
  }

  // Helper method to reset to pristine seed state if needed
  reset() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('campusconnect_db_messages');
        localStorage.removeItem('campusconnect_db_conversations');
        localStorage.removeItem('campusconnect_db_notifications');
        localStorage.removeItem('campusconnect_db_streamPosts');
      } catch {
        // Ignore
      }
    }
    this.users = [...initialUsers];
    this.departments = [...initialDepartments];
    this.courses = [...initialCourses];
    this.allocations = [...initialAllocations];
    this.classes = [...initialClasses];
    this.enrollments = [...initialEnrollments];
    this.streamPosts = [...initialStreamPosts];
    this.assignments = [...initialAssignments];
    this.submissions = [...initialSubmissions];
    this.materials = [...initialMaterials];
    this.quizzes = [...initialQuizzes];
    this.quizAttempts = [...initialQuizAttempts];
    this.attendance = [...initialAttendance];
    this.announcements = [...initialAnnouncements];
    this.conversations = [...initialConversations];
    this.messages = [...initialMessages];
    this.callLogs = [...initialCallLogs];
    this.notifications = [...initialNotifications];
    this.events = [...initialCalendarEvents];
  }
}

export const db = new MockDatabase();

