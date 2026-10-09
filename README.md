# CampusConnect — Unified Institutional Campus & Classroom Platform

> **Comprehensive Enterprise LMS, Real-Time Collaboration & Communication Platform**  
> *Academic Web Technology Capstone Project — Final Submission (Phases 1–6 Complete)*  
> Built for Computer Engineering & Institutional Academic Administration

---

## 1. System Architecture Overview

CampusConnect is engineered as a three-tier microservices-aligned architecture designed for high-availability academic administration, real-time messaging, WebRTC audio/video teleconferencing, and role-based analytical intelligence.

```
                           ┌────────────────────────────────────────┐
                           │      Browser Client (Single Page App)   │
                           │  React 18 + TypeScript + Redux Toolkit  │
                           │       Tailwind CSS + Recharts           │
                           │       http://localhost:3000            │
                           └───────┬────────────────────────┬───────┘
                                   │                        │
                        REST APIs  │                        │ Socket.IO / WebRTC
                    (JWT Bearer)   │                        │ (Signaling & Presence)
                                   ▼                        ▼
         ┌──────────────────────────────────┐      ┌──────────────────────────────────┐
         │     Spring Boot 3 Backend        │      │    Node.js Signaling Server      │
         │  Java 17 + Spring Security 6     │      │   Express + Socket.IO + CORS     │
         │  JPA / Hibernate + MySQL 8       │      │  Presence, Mesh WebRTC, Rooms    │
         │      http://localhost:8080       │      │      http://localhost:5000       │
         └─────────────────┬────────────────┘      └──────────────────────────────────┘
                           │
                           ▼
         ┌──────────────────────────────────┐
         │         MySQL 8 Database         │
         │       `campusconnect_db`         │
         └──────────────────────────────────┘
```

### The Three Services:
1. **`campusconnect-frontend/` (Root workspace)**:
   - React 18, TypeScript (Strict Mode), Vite, Redux Toolkit.
   - Code-split routes with `React.lazy()` and `Suspense`.
   - Audio Engine (.wav voice notes recorder & player).
   - Recharts analytical intelligence dashboards.
   - WCAG 2.1 AA accessible modals, inputs, and media controls.
2. **`campusconnect-backend/`**:
   - Spring Boot 3.x, Java 17, Spring Security 6 (Stateless JWT).
   - MySQL 8 with Hibernate/JPA schema mapping.
   - Additive Phase 6 Analytics Projections (`/api/analytics/{admin,hod,faculty,student}`).
   - Postman Collection in `campusconnect-backend/postman/CampusConnect.postman_collection.json`.
3. **`campusconnect-signaling/`**:
   - Node.js & Express with Socket.IO.
   - Real-time online presence heartbeats, typing indicators, read receipts.
   - 1:1 WebRTC audio/video call signaling (Offer/Answer/ICE candidate exchange).
   - Interactive live lecture rooms with mesh connection coordination and moderation controls.

---

## 2. Quick Start & Startup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or later
- **Java JDK**: 17 or later (`java -version`)
- **Maven**: 3.8+ (or use backend `mvn.cmd` wrapper)
- **MySQL**: 8.0+ running on `localhost:3306`

---

### Step 1: Start MySQL Database
Create the database in MySQL:
```sql
CREATE DATABASE IF NOT EXISTS campusconnect_db;
```

---

### Step 2: Start Spring Boot Backend (Port 8080)
Open a terminal in `campusconnect-backend`:
```powershell
cd campusconnect-backend
mvn spring-boot:run
# or execute run-backend.bat
```
The backend initializes the schema automatically and runs on `http://localhost:8080`.

---

### Step 3: Start Node.js Signaling Server (Port 5000)
Open a second terminal in `campusconnect-signaling`:
```powershell
cd campusconnect-signaling
npm install
npm run dev
```
The signaling server listens on `http://localhost:5000`.

---

### Step 4: Start Frontend SPA (Port 3000)
Open a third terminal in the project root:
```powershell
npm install
npm run dev
```
The frontend is available at `http://localhost:3000`.

---

## 3. Seed Accounts & Role Credentials

The login interface features a **1-Click Demo Accounts Selector** for presentation convenience:

| Role | Name | Email | Password | Scope & Description |
|---|---|---|---|---|
| **ADMIN** | Aarav Mehta | `admin@campus.test` | `Admin@123` | Institutional Admin; Platform oversight, departments, user master |
| **HOD** | Dr. Kavita Rao | `hod.ce@campus.test` | `Hod@123` | Computer Engineering HOD; Faculty workloads, circulars, department stats |
| **HOD** | Dr. Sameer Joshi | `hod.it@campus.test` | `Hod@123` | Information Technology HOD; IT curriculum and faculty allocations |
| **FACULTY** | Prof. Neha Kulkarni | `neha@campus.test` | `Fac@123` | CE Faculty; Teaches Web Dev (CE-A), grading, attendance, VoIP |
| **FACULTY** | Prof. Rohan Desai | `rohan@campus.test` | `Fac@123` | CE Faculty; Teaches Database Systems (CE-A) |
| **FACULTY** | Prof. Anita Patil | `anita@campus.test` | `Fac@123` | CE Faculty; Teaches Java & Spring (CE-B) |
| **STUDENT** | Aryan Sharma | `student1@campus.test` | `Stu@123` | CE Year 3 Div A; Roll CE301, assignment submissions, doubts |
| **STUDENT** | Diya Patel | `student2@campus.test` | `Stu@123` | CE Year 3 Div A; Roll CE302, continuous assessment |
| **STUDENT** | Rohan Gupta | `student5@campus.test` | `Stu@123` | CE Year 3 Div B; Roll CE305 |
| **STUDENT** | Riya Sen | `student12@campus.test` | `Stu@123` | IT Year 2 Div A; Roll IT204, cross-department isolation testing |

*Full database contains 12 seeded students (`student1@campus.test` to `student12@campus.test`).*

---

## 4. Phase Implementations (Phases 1–6)

- **Phase 1 — Core Foundation**:
  - JWT Authentication, protected routes, role routing, theme engine (Obsidian Dark / Light).
  - Strict role permission interaction matrix (`canInteract`).
- **Phase 2 — Google Classroom LMS**:
  - Course and Class management, enrollment via 6-character class code.
  - Stream announcements with nested replies, material attachments.
  - Assignment submission lifecycle: Create &rarr; Submit &rarr; Grade & feedback &rarr; Gradebook.
  - Interactive MCQ Quizzes with instant scoring, session-based attendance register.
- **Phase 3 — Institutional Department Layer & Notices**:
  - Department management, HOD faculty-to-course allocations.
  - DOMPurify sanitized institutional circulars with targeted audience filters (Role, Department, Year).
  - Unread notification badges, synchronized calendar scheduler.
- **Phase 4 — Chat, Doubts & Real-Time Presence**:
  - Direct 1:1 and class group chat channels.
  - Optimistic message delivery with retry mechanism on failure.
  - Real-time online/offline presence indicators, typing indicators, read receipts.
  - Audio voice notes (.wav format recording & waveform playback with speed control).
- **Phase 5 — WebRTC VoIP Calls & Live Lectures**:
  - 1:1 audio and video calling with SDP offer/answer and ICE candidate relay.
  - Ringtone chime audio synthesizer, incoming call modal with auto-timeout.
  - Interactive lecture rooms: lobby device preview, student hand-raise, faculty mute-all moderation, screen sharing.
- **Phase 6 — Analytics, Performance Hardening, Accessibility & Polish**:
  - **Read-Only Backend Analytics**: Additive endpoints for Admin, HOD, Faculty, and Student.
  - **Analytical Dashboards**: Recharts interactive Bar, Line, and Pie/Donut charts with KPI cards and skeletons.
  - **Performance Optimization**: Lazy-loaded routes with `React.lazy()`, memoized thread messages (`React.memo`), memoized filter operations (`useMemo`).
  - **Accessibility (WCAG 2.1 AA)**: Explicit `aria-label` on all icon controls, accessible `role="dialog"` modals with Escape listeners, high-contrast HSL color tokens.
  - **Full Test Suite**: 87/87 Vitest automated tests passing across all features.

---

## 5. Verification & Testing

### Running Frontend Tests
```powershell
npm test
# Or run with single-pass report:
npx vitest run
```
**Test Results**: `8 passed (8 test files, 87 total tests)` covering Permissions, Auth, LMS, Departments, Chat, Calls, and Analytics.

### Production Build Verification
```powershell
npm run build
```
Executes TypeScript type checker (`tsc`) and Vite production bundle compilation.

---

## 6. Postman API Collection

The backend REST API is completely documented and tested in Postman format:
- **Location**: `campusconnect-backend/postman/CampusConnect.postman_collection.json`
- **Features**:
  - Includes pre-configured `base_url` (`http://localhost:8080/api`) and `jwt_token`.
  - Login endpoint automatically extracts and saves `jwt_token` into collection variables upon successful login.
  - Complete coverage: Auth, Departments, Users, Courses, Classes, Allocations, Call Logs, and Analytics.

---

## 7. Submission Checklist & Artifacts

- [x] Three services running and configured end-to-end.
- [x] Branch `phase-6` committed with clean git history.
- [x] Backend additive changes strictly isolated to `/api/analytics` without schema regressions.
- [x] In-memory fallback and live backend dual-mode support (`VITE_USE_MOCKS`).
- [x] Postman collection validated.
- [x] Presentation walkthrough guide documented in `DEMO.md`.
