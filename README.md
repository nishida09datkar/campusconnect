# CampusConnect Frontend

> **Unified Campus Communication and Classroom Platform**  
> *Frontend Build for React 18 + TypeScript (Strict Mode) & Vite*  
> Academic Context: Web Development Project, Computer Engineering, AY 2026-27

---

## 1. Project Overview

CampusConnect integrates a Google Classroom-style Learning Management System (LMS) with real-time chat and WebRTC voice/video calling. Institutional communication permissions are strictly driven by roles, departments, courses, and active student enrollments.

### Core Roles & Interaction Rules
1. **ADMIN**: Full campus oversight, manages departments, users, and institute-wide analytics.
2. **HOD**: Department head, allocates faculty to departmental courses, broadcasts circulars.
3. **FACULTY**: Teaches assigned courses, manages stream announcements, assignments, grading, quizzes, attendance, doubts, and VoIP calls with enrolled students.
4. **STUDENT**: Enrolled in courses, submits lab work, takes quizzes, raises doubts, and initiates calls with assigned faculty.

---

## 2. Tech Stack

- **Framework**: React 18 + TypeScript (Strict Mode) with Vite
- **Routing**: React Router DOM v6 with nested routes, lazy loading, and role-based route guards (`ProtectedRoute`)
- **Global State**: Redux Toolkit (`authSlice`, `uiSlice`, typed hooks `useAppDispatch`, `useAppSelector`)
- **Styling**: Tailwind CSS + custom shadcn-inspired primitives, CSS variables, dark mode (`class` strategy)
- **Forms & Validation**: React Hook Form + Zod
- **HTTP Client**: Axios with Bearer token interceptor and normalized `ApiError`
- **Real-Time & Signaling**: Socket.IO client (mock adapter during mock mode)
- **VoIP & Media**: Browser WebRTC (`RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`)
- **Testing**: Vitest + React Testing Library + jsdom
- **Icons**: Lucide React

---

## 3. Quick Start & Setup

### Prerequisites
- Node.js 18+ (tested on Node 20 / 24)
- npm 9+

### Installation & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
# The application will be available at http://localhost:3000

# 3. Run test suite
npm run test

# 4. Run linter
npm run lint

# 5. Build for production
npm run build
```

---

## 4. Environment Variables (`.env`)

Configure via `.env` or `.env.example`:

| Variable | Default Value | Description |
|---|---|---|
| `VITE_USE_MOCKS` | `true` | Set to `false` to connect to real Spring Boot and Node.js backends |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Spring Boot REST API base URL |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Node.js / Socket.IO real-time server URL |
| `VITE_STUN_URL` | `stun:stun.l.google.com:19302` | WebRTC STUN server URL |
| `VITE_TURN_URL` | `""` | Optional TURN server URL |
| `VITE_TURN_USER` | `""` | TURN username |
| `VITE_TURN_PASS` | `""` | TURN credential |
| `VITE_MAX_UPLOAD_MB` | `10` | Maximum file attachment size in MB |

---

## 5. Demo Accounts (Section 18 Seed Data)

The login screen provides a **1-click Demo Accounts card** for instant authentication:

| Role | Name | Email | Password | Scope / Context |
|---|---|---|---|---|
| **ADMIN** | Aarav Mehta | `admin@campus.test` | `Admin@123` | Institute-wide Admin |
| **HOD** | Dr. Kavita Rao | `hod.ce@campus.test` | `Hod@123` | Computer Engineering HOD |
| **HOD** | Dr. Sameer Joshi | `hod.it@campus.test` | `Hod@123` | Information Technology HOD |
| **FACULTY** | Prof. Neha Kulkarni | `neha@campus.test` | `Fac@123` | CE, Teaches Web Dev (CE-A) |
| **FACULTY** | Prof. Rohan Desai | `rohan@campus.test` | `Fac@123` | CE, Teaches Database Systems (CE-A) |
| **FACULTY** | Prof. Anita Patil | `anita@campus.test` | `Fac@123` | CE, Teaches Java & Spring (CE-B) |
| **FACULTY** | Prof. Vivek Shah | `vivek@campus.test` | `Fac@123` | IT, Teaches Networks (IT-A) |
| **FACULTY** | Prof. Sara Khan | `sara@campus.test` | `Fac@123` | IT, Teaches Data Structures (IT-A) |
| **STUDENT** | Aryan Sharma | `student1@campus.test` | `Stu@123` | CE Year 3 Div A (Roll: CE301) |
| **STUDENT** | Diya Patel | `student2@campus.test` | `Stu@123` | CE Year 3 Div A (Roll: CE302) |
| **STUDENT** | Rohan Gupta | `student5@campus.test` | `Stu@123` | CE Year 3 Div B (Roll: CE305) |
| **STUDENT** | Riya Sen | `student12@campus.test` | `Stu@123` | IT Year 2 Div A (Roll: IT204) |

*Note: 12 students are seeded (`student1@campus.test` to `student12@campus.test`).*

---

## 6. Project Folder Structure

```
campusconnect-frontend/
├── src/
│   ├── api/
│   │   ├── axios.ts                  # Axios instance, Bearer token interceptor, 401 handler
│   │   ├── config.ts                 # Environment variables and USE_MOCKS switch
│   │   ├── mock/
│   │   │   ├── db.ts                 # In-memory database seeded with Section 18 data
│   │   │   └── delay.ts              # Latency simulation (300-800ms) with failure injection
│   │   └── services/
│   │       └── auth.service.ts       # Authentication service functions
│   ├── components/
│   │   ├── ui/                       # Reusable UI primitives (Button, Card, Input, Avatar...)
│   │   ├── layout/                   # AppShell, Sidebar, Topbar, MobileDrawer, PageHeader
│   │   └── common/                   # ErrorBoundary, ToastContainer, RoleBadge
│   ├── features/
│   │   ├── auth/                     # authSlice, selectors
│   │   └── ui/                       # uiSlice (theme, sidebar, toasts)
│   ├── pages/
│   │   ├── auth/                     # LoginPage, ForgotPasswordPage
│   │   ├── admin/                    # AdminDashboard, DepartmentsPage, UsersPage, AnalyticsPage
│   │   ├── hod/                      # HodDashboard, FacultyAllocationPage, NoticesPage
│   │   ├── faculty/                  # FacultyDashboard, MyClassesPage, ClassDetailPage
│   │   ├── student/                  # StudentDashboard, StudentClassesPage, AssignmentPage
│   │   └── shared/                   # ForbiddenPage (403), NotFoundPage (404), ProfilePage, Chat...
│   ├── routes/
│   │   ├── AppRoutes.tsx             # Nested lazy routes with Suspense
│   │   ├── ProtectedRoute.tsx        # Role-based route guard
│   │   └── roleRoutes.ts             # Route lookup helpers
│   ├── store/
│   │   ├── store.ts                  # Configured Redux Toolkit store
│   │   └── hooks.ts                  # Typed useAppDispatch & useAppSelector
│   ├── types/                        # Strict domain types (no any)
│   │   ├── auth.ts, academic.ts, classroom.ts, communication.ts, common.ts, index.ts
│   │   └── index.ts
│   └── utils/
│       ├── permissions.ts            # canInteract() implementation of Section 3.2 Matrix
│       ├── constants.ts              # Demo credentials, role definitions, badges
│       ├── format.ts                 # Date and string formatters
│       └── storage.ts                # Non-sensitive session hint management
```

---

## 7. Backend Contracts

### 7.1 REST API Contract (Spring Boot / Node)

| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login with credentials, returns `{ accessToken, user }` | Public |
| `POST` | `/api/auth/refresh` | Refresh JWT access token | Public |
| `GET` | `/api/auth/me` | Return currently authenticated user profile | All authenticated |
| `GET` | `/api/users?role=&departmentId=&q=&page=` | Paginated and filtered users list | ADMIN, HOD |
| `POST` / `PUT` | `/api/users`, `/api/users/:id` | Create or update user profile | ADMIN |
| `PATCH` | `/api/users/:id/status` | Activate or deactivate user | ADMIN |
| `GET` / `POST` | `/api/departments` | List and create academic departments | ADMIN |
| `PUT` / `DELETE` | `/api/departments/:id` | Update or delete department | ADMIN |
| `GET` | `/api/courses?departmentId=` | List courses by department | ADMIN, HOD, FACULTY |
| `GET` / `POST` | `/api/allocations` | List and create faculty-to-course allocations | HOD |
| `DELETE` | `/api/allocations/:id` | Delete faculty allocation | HOD |
| `GET` / `POST` | `/api/classes` | Get enrolled/teaching classes or create class | FACULTY, STUDENT |
| `POST` | `/api/classes/join` | Join class via class code | STUDENT |
| `GET` / `POST` | `/api/classes/:id/stream` | Get stream posts or post announcement/doubt | Class members |
| `POST` | `/api/stream/:postId/replies` | Reply to stream post or doubt | Class members |
| `GET` / `POST` | `/api/classes/:id/assignments` | List and create assignments | FACULTY, STUDENT |
| `POST` | `/api/assignments/:id/submissions` | Submit lab work or assignment | STUDENT |
| `GET` | `/api/assignments/:id/submissions` | Get all submissions for an assignment | FACULTY |
| `PUT` | `/api/submissions/:id/grade` | Submit grade and instructor feedback | FACULTY |
| `GET` / `POST` | `/api/classes/:id/quizzes` | List and create MCQ quizzes | FACULTY, STUDENT |
| `POST` | `/api/quizzes/:id/attempts` | Submit quiz attempt and answers | STUDENT |
| `GET` / `POST` | `/api/classes/:id/attendance` | Read and record class attendance | FACULTY (Read: STUDENT) |
| `GET` / `POST` | `/api/announcements` | List and broadcast circulars | ADMIN, HOD |
| `GET` | `/api/notifications` | List user notifications | All |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read | All |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications read | All |
| `GET` | `/api/conversations` | List user chat conversations | All |
| `POST` | `/api/conversations` | Create direct or group conversation | All (Rules apply) |
| `GET` | `/api/conversations/:id/messages` | Paginated messages in thread | All |
| `GET` | `/api/calls/logs` | Call logs and history | All |
| `GET` | `/api/analytics/:role` | Role-specific analytics and KPIs | Respective role |
| `POST` | `/api/files/upload` | Multipart file upload returning `Attachment` | All |

---

### 7.2 Socket.IO Event Contract (Node.js Real-time Service)

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `presence:update` | Server &rarr; Client | `{ userId, online, lastSeen? }` | Real-time presence updates |
| `chat:send` | Client &rarr; Server | `{ conversationId, body, attachments, tempId }` | Send chat message |
| `chat:message` | Server &rarr; Client | `Message` | Deliver incoming message |
| `chat:ack` | Server &rarr; Client | `{ tempId, message }` | Reconcile optimistic message |
| `chat:typing` | Both | `{ conversationId, userId, isTyping }` | Typing indicator |
| `chat:read` | Both | `{ conversationId, userId, upToMessageId }` | Read receipts |
| `notification:new` | Server &rarr; Client | `AppNotification` | Push real-time notification |
| `call:request` | Client &rarr; Server | `{ callId, toUserId, kind, context? }` | Request 1:1 call |
| `call:incoming` | Server &rarr; Client | `{ callId, fromUser, kind, context? }` | Ring callee |
| `call:accept` | Client &rarr; Server | `{ callId }` | Callee accepts |
| `call:decline` | Client &rarr; Server | `{ callId }` | Callee declines |
| `call:cancel` | Client &rarr; Server | `{ callId }` | Caller cancels before pickup |
| `call:end` | Both | `{ callId }` | End active call |
| `webrtc:offer` | Both | `{ callId, sdp }` | SDP offer exchange |
| `webrtc:answer` | Both | `{ callId, sdp }` | SDP answer exchange |
| `webrtc:ice` | Both | `{ callId, candidate }` | ICE candidate exchange |
| `lecture:join` | Client &rarr; Server | `{ roomId }` | Join live lecture |
| `lecture:leave` | Client &rarr; Server | `{ roomId }` | Leave live lecture |
| `lecture:participants` | Server &rarr; Client | `{ roomId, participants[] }` | Roster update |
| `lecture:hand` | Both | `{ roomId, userId, raised }` | Raise / lower hand |
| `lecture:control` | Faculty &rarr; Server | `{ roomId, action, targetUserId? }` | Mute, remove, end lecture |

---

## 8. Assumptions

1. **Security & Session Persistence**: In-memory token storage is enforced per Section 16 to prevent token theft via XSS. Only non-sensitive session hints (`userId`, `email`, `role`) are saved in `localStorage` to allow session hydration via `/api/auth/me` on browser reload.
2. **Switching to Real Services**: When `VITE_USE_MOCKS=false`, the client seamlessly connects to the Spring Boot REST API at `http://localhost:8080` and the Node.js Socket.IO server at `http://localhost:5000` with zero frontend code modifications.
3. **WebRTC HTTPS Requirement**: Outside of localhost, browsers require HTTPS to access camera and microphone devices.

---

## 9. Next.js SSR Migration Notes (Future Roadmap)

- The application structure isolates state slices, service APIs, and hooks, facilitating seamless migration to Next.js App Router if server-side rendering is required in future releases.
- Routes can map 1-to-1 to Next.js route groups `app/(admin)/`, `app/(hod)/`, `app/(faculty)/`, `app/(student)/`.
