# CampusConnect — Capstone Presentation & Live Viva Demo Script

> **Turn-by-Turn Demonstration Guide for Academic Examiners & Project Evaluators**  
> Covers the entire academic lifecycle from institutional governance to real-time WebRTC media and analytics.

---

## Pre-Demo Setup Checklist

1. **MySQL Database**: Running on `localhost:3306` with database `campusconnect_db`.
2. **Spring Boot Backend**: Running on `http://localhost:8080` (`cd campusconnect-backend && mvn spring-boot:run`).
3. **Node.js Signaling Server**: Running on `http://localhost:5000` (`cd campusconnect-signaling && npm run dev`).
4. **Vite Frontend**: Running on `http://localhost:3000` (`npm run dev`).
5. **Browser Windows**: Open two browser profiles or an Incognito window side-by-side to demonstrate real-time interactions between Faculty and Student simultaneously.

---

## Turn 1: Administrator — Institutional Governance & Platform Health

### Persona
- **Account**: `admin@campus.test` / `Admin@123` (Aarav Mehta, Institutional Administrator)
- **Concept**: Centralized campus authority, institutional KPIs, and department provisioning.

### Step-by-Step Flow
1. **Login**:
   - Go to `http://localhost:3000/login`.
   - Click the **"Aarav Mehta (ADMIN)"** demo button on the login screen, then click **Sign In**.
2. **Review Platform Analytics (`/admin/analytics`)**:
   - Navigate to **Analytics** in the sidebar.
   - Point out the **KPI Cards**: Total Departments, Faculty count, Student population, Active Classes, Weekly Communication Volume.
   - Show the **Weekly Communication Velocity** bar chart (messages vs. calls by day) and the **Campus Population Breakdown** donut chart.
3. **Manage Departments (`/admin/departments`)**:
   - Navigate to **Departments**.
   - Review existing Computer Engineering (CE) and Information Technology (IT) departments.
   - Click **+ Add Department**, enter:
     - Name: `Artificial Intelligence & Data Science`
     - Code: `AIDS`
     - Description: `Specialized department for intelligent systems and data engineering`
   - Click **Save**. Verify it instantly appears in the department cards.
4. **User Administration (`/admin/users`)**:
   - Navigate to **Users**.
   - Filter by Role: Select **FACULTY** or **STUDENT**.
   - Demonstrate the role-based security boundary: Explain that only Admins can create or modify system-wide user credentials and department bindings.

---

## Turn 2: Head of Department (HOD) — Workload Allocation & Targeted Circulars

### Persona
- **Account**: `hod.ce@campus.test` / `Hod@123` (Dr. Kavita Rao, Computer Engineering HOD)
- **Concept**: Academic supervision, faculty course distribution, and audience-targeted circulars.

### Step-by-Step Flow
1. **Login**:
   - Switch user to **Dr. Kavita Rao (HOD - CE)**.
2. **Review Department Analytics (`/hod/analytics`)**:
   - Navigate to **Department Analytics**.
   - Review the **Faculty Workload Distribution** bar chart showing classes and student loads assigned to Prof. Neha, Prof. Rohan, and Prof. Anita.
   - Review the **Department Attendance Progression** line chart tracking weekly lecture participation rates.
3. **Faculty Allocations (`/hod/allocations`)**:
   - Navigate to **Faculty Allocation**.
   - Show how courses within Computer Engineering are mapped to instructors.
   - Point out the validation preventing unassigned courses or cross-department allocation leaks.
4. **Broadcast Targeted Notice (`/hod/notices`)**:
   - Navigate to **Notices & Circulars**.
   - Click **+ New Notice**.
   - Title: `Submission Deadline Reminder: Web Development Lab`
   - Content: `All third-year CE students are advised to submit Lab 2 before Friday 11:59 PM.`
   - Target Audience Filtering:
     - Target Role: `STUDENT`
     - Department: `Computer Engineering (CE)`
     - Year: `Year 3`
   - Click **Publish Notice**.
   - **Viva Highlight**: Explain that DOMPurify sanitizes the notice content against XSS, and the notification engine strictly targets CE Year 3 students without spamming faculty or other departments.

---

## Turn 3: Faculty — Classroom LMS, Stream & Assignments

### Persona
- **Account**: `neha@campus.test` / `Fac@123` (Prof. Neha Kulkarni, Faculty)
- **Concept**: Teaching delivery, stream discussions, lab assignment distribution, and grading queues.

### Step-by-Step Flow
1. **Login**:
   - Log in as **Prof. Neha Kulkarni (FACULTY)** in Browser Window 1.
2. **Open Assigned Class (`/faculty/classes`)**:
   - Select **Web Development CE-A (CS301)**.
3. **Stream Announcement**:
   - On the **Stream** tab, post an announcement:
     - `"Welcome to Week 6! We will be discussing WebRTC MediaStreams and AudioNodes in today's session."`
   - Point out real-time student reply capability.
4. **Create Lab Assignment**:
   - Switch to the **Classwork** tab.
   - Click **+ Create Assignment**.
   - Title: `Lab 3: Audio API & WebRTC Implementation`
   - Instructions: `Record and submit an explanation of the Web Audio graph used in CampusConnect.`
   - Maximum Marks: `50`
   - Due Date: Set to 3 days in the future.
   - Click **Assign**.
5. **Class Attendance Register**:
   - Switch to the **Attendance** tab.
   - Select today's session date.
   - Mark students as Present / Absent and click **Save Attendance**.
   - Show how the average attendance percentage updates dynamically.

---

## Turn 4: Student — Learning, Submission & Voice Note Doubts

### Persona
- **Account**: `student1@campus.test` / `Stu@123` (Aryan Sharma, CE Year 3 Student)
- **Concept**: Student learning experience, notification receipt, lab submission, and audio doubt resolution.

### Step-by-Step Flow
1. **Login**:
   - In Browser Window 2 (side-by-side), log in as **Aryan Sharma (STUDENT)**.
2. **Notification Bell Check**:
   - Notice the bell badge in the top bar. Click the bell to view:
     - The targeted notice published by Dr. Kavita Rao in Turn 2.
     - The new assignment notification published by Prof. Neha in Turn 3.
3. **Complete Assignment Submission**:
   - Open **Web Development CE-A**.
   - Open **Lab 3: Audio API & WebRTC Implementation**.
   - Attach a solution file or link, add private comments: `"Attached solution for review."`
   - Click **Turn In**.
4. **Chat & Voice Note Doubt Resolution (`/chat`)**:
   - Open the **Chat** module from the sidebar.
   - Select the direct conversation with **Prof. Neha Kulkarni**.
   - Click the **Mic** icon in the message bar to record a voice note:
     - Speak for 3–5 seconds: *"Prof. Neha, I have a doubt regarding the sample rate configuration in the audio encoder."*
     - Click **Send Audio**.
   - Show that the message is formatted as a `.wav` audio note with duration and playback speed toggles (1x, 1.5x, 2x).
   - In Browser Window 1 (Prof. Neha), show that the voice note arrived instantly via Socket.IO with audio playback ready.

---

## Turn 5: Real-Time WebRTC Media — VoIP Call & Live Lecture Room

### Persona
- Both **Prof. Neha Kulkarni** and **Aryan Sharma** simultaneously.
- **Concept**: Low-latency peer-to-peer audio/video streaming, call signaling, and lecture room moderation.

### Step-by-Step Flow
1. **1:1 WebRTC Video Call**:
   - In Browser Window 1 (Prof. Neha's chat with Aryan), click the **Start Video Call** button in the header.
   - Browser Window 2 (Aryan Sharma) immediately rings with the **Incoming Call Modal**:
     - Plays synthesized ringtone chime.
     - Displays caller avatar, call type, and 30-second auto-timeout countdown.
   - Click **Accept Call** in Browser Window 2.
   - Point out the active call interface:
     - Local and remote media video tiles.
     - HD quality badge indicator.
     - Device settings popover, microphone mute/unmute, camera toggle, screen sharing, and end call button.
   - Click **End Call**. Call log is automatically persisted.
2. **Interactive Live Lecture Classroom (`/lecture/lecture-101`)**:
   - Prof. Neha opens the class lecture room.
   - **Lecture Lobby**: Preview camera and microphone before entering the room.
   - Click **Join Lecture Room**.
   - Student Aryan joins the same lecture room.
   - Demonstrate **Student Hand-Raise**: Student clicks "Raise Hand" &rarr; bouncing hand badge appears on faculty's screen.
   - Demonstrate **Faculty Moderation**: Faculty clicks **"Mute All"** &rarr; all student microphones are silenced.

---

## Turn 6: Evaluation, Academic Analytics & Institutional Closing

### Persona
- **Prof. Neha Kulkarni**, **Aryan Sharma**, and **Dr. Kavita Rao**.

### Step-by-Step Flow
1. **Grade Student Lab Work**:
   - Prof. Neha navigates to **Submissions & Grading** (`/faculty/submissions`).
   - Opens Aryan Sharma's submission for `Lab 3`.
   - Enters Marks: `48 / 50`
   - Feedback: `Excellent audio node graph explanation and clean error handling.`
   - Click **Grade Submission**.
2. **Student Academic Analytics (`/student/analytics`)**:
   - Switch to Aryan Sharma's screen &rarr; navigate to **My Analytics**.
   - Show updated:
     - **Cumulative Average**: Updates to reflect distinction standing.
     - **Attendance Standing**: Donut chart displaying attended vs. absent sessions.
     - **Continuous Assessment Curve**: Line graph reflecting the newly graded 96% score.
     - **Recent Submissions Log**: Displays `Lab 3` with status `GRADED`.
3. **Closing Institutional View**:
   - Return to Admin or HOD dashboard &rarr; observe how student submissions and faculty grading throughput are aggregated into department-wide and campus-wide metrics.

---

## Technical Viva & Architecture Defense Points

During the project defense, highlight these engineering decisions:

### 1. WebRTC Signaling Architecture (Mesh vs. SFU)
- **Design Decision**: For 1:1 VoIP calls and classroom rooms under 6 peers, a direct **P2P Full Mesh** topology is utilized via Node.js Socket.IO signaling.
- **Rationale**: Zero media server transcoding costs, sub-100ms latency, end-to-end encryption by default, and fallback to STUN (`stun.l.google.com:19302`) for NAT traversal.
- **Cap Exceeded Guard**: If participant count exceeds 6 peers, the client automatically raises `onMeshCapExceeded` notification advising transition to SFU mode.

### 2. Dual-Engine Audio Recording & Playback (.wav)
- **Audio Recorder**: Uses the browser `MediaRecorder` or Web Audio `AudioContext` with standard 44.1kHz PCM sampling encoded into canonical `.wav` format.
- **Audio Engine**: If native HTML5 `<audio>` playback fails due to cross-origin or data URL restrictions, the universal Web Audio `AudioEngine` decodes the array buffer and drives playback with real-time waveform scrubbing and speed controls (1x, 1.5x, 2x).

### 3. Role-Based Interaction Matrix (`canInteract`)
- **Security Rule**: Communication between members is governed by academic proximity. A student cannot arbitrarily call an unassigned professor or a student from another department without active shared course enrollment.
- **Enforcement**: Validated both on the frontend UI and within the Spring Boot security service layer.

### 4. Front-End Performance Hardening
- **Code Splitting**: All pages lazy-loaded via `React.lazy()` with route-level `Suspense` fallbacks.
- **Rendering Optimization**: Chat message history uses `React.memo` (`MessageBubbleItem`) so typing in the text box does not trigger re-render of older messages.
- **Memoized Filtering**: Heavy submission and notification filters use `useMemo`.

### 5. Accessibility (WCAG 2.1 AA Compliance)
- All interactive icon buttons have descriptive `aria-label` attributes.
- Modals include focus traps, `role="dialog"`, `aria-modal="true"`, and keyboard `Escape` dismissal.
- High-contrast HSL color system tested across light and dark themes.
