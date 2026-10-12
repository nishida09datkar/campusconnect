# CampusConnect Core LMS MySQL Round-Trip Verification Report

This document records the exact steps, live execution commands, and verified before/after values for the bi-directional database round-trip between MySQL (XAMPP phpMyAdmin) and the CampusConnect frontend/backend.

---

## 1. Environment & Service Configuration

| Service | Host & Port | Configuration / Details |
|---|---|---|
| **MySQL (XAMPP MariaDB)** | `127.0.0.1:3306` | Database: `campusconnect`<br>User: `root`<br>Password: *(empty)* |
| **Spring Boot Backend** | `http://localhost:8080` | Mode: MySQL dialect<br>Entities: `Department`, `Course`, `ClassRoom`, `Enrollment`, `FacultyAllocation`, `User`, `CallLog`<br>Auto-seeding: `DataSeeder.java` |
| **Vite Frontend** | `http://localhost:3000` | Config: `VITE_USE_MOCKS=false` in `.env`<br>Base API: `http://localhost:8080` |

---

## 2. Test 1: MySQL Edit $\rightarrow$ Frontend Reflection (Database-to-UI)

### Objective
Manually update a row in the MySQL database (simulating an edit via phpMyAdmin) and verify that refreshing the frontend reflects the updated value immediately with **zero code changes** and **zero restarts**.

### Execution & Verification Log

#### Step 1: Initial State Inspection
- **User Account**: Faculty `neha@campus.test` (Prof. Neha Kulkarni, `user-fac-neha`)
- **Target Entity**: `classrooms` row with `id = 'class-1'`
- **Query / API Call**: `GET /api/classes/class-1`
- **Observed Initial Value**:
  ```text
  Title: "Web Development (CE-A)"
  Section: "A"
  Class Code: "WEB3A1"
  ```

#### Step 2: Direct Database Edit in MySQL (phpMyAdmin)
Executed directly against the MySQL `campusconnect` database:
```sql
USE campusconnect;
UPDATE classrooms 
SET title = 'Advanced Full-Stack Engineering (CE-A)' 
WHERE id = 'class-1';
```

#### Step 3: Frontend Refresh Verification
Refreshed the application page (`http://localhost:3000/classes`) / invoked the live endpoint `GET /api/classes/class-1` with faculty Bearer authentication token.
- **Observed Updated Value**:
  ```text
  Title: "Advanced Full-Stack Engineering (CE-A)"
  Section: "A"
  Class Code: "WEB3A1"
  ```

#### Result
| Metric | Before MySQL Edit | After Direct MySQL Edit |
|---|---|---|
| **MySQL Row Value (`title`)** | `Web Development (CE-A)` | `Advanced Full-Stack Engineering (CE-A)` |
| **Frontend/API Value (`title`)** | `Web Development (CE-A)` | `Advanced Full-Stack Engineering (CE-A)` |
| **Outcome** | **PASS** — Direct MySQL manual edit instantly reflected on refresh. | |

---

## 3. Test 2: Frontend UI Creation $\rightarrow$ Real MySQL Row (UI-to-Database)

### Objective
Create new records through the frontend application and confirm that rows are physically inserted into the MySQL database tables with the correct schema and foreign keys.

### Test 2A: Classroom Creation by Faculty

#### Step 1: Action in Frontend
Logged in as Faculty (`neha@campus.test` / `password123`) and submitted a classroom creation request:
- **Course**: `course-ce-301`
- **Title**: `Cloud Computing & Microservices (CE-D)`
- **Section**: `D`
- **Cover Color**: `from-cyan-600 to-blue-600`

#### Step 2: Response from Live Backend
```json
{
  "id": "class-1791627306355",
  "courseId": "course-ce-301",
  "title": "Cloud Computing & Microservices (CE-D)",
  "section": "D",
  "classCode": "CC8870",
  "facultyId": "user-fac-neha",
  "studentsCount": 0
}
```

#### Step 3: Direct MySQL Verification
Executed SQL query in MySQL / phpMyAdmin:
```sql
USE campusconnect;
SELECT id, title, section, class_code, faculty_id 
FROM classrooms 
WHERE id = 'class-1791627306355';
```

#### Observed MySQL Output:
```text
+---------------------+----------------------------------------+---------+------------+---------------+
| id                  | title                                  | section | class_code | faculty_id    |
+---------------------+----------------------------------------+---------+------------+---------------+
| class-1791627306355 | Cloud Computing & Microservices (CE-D) | D       | CC8870     | user-fac-neha |
+---------------------+----------------------------------------+---------+------------+---------------+
1 row in set (0.000 sec)
```
- **Outcome**: **PASS** — Classroom row persisted in MySQL table `classrooms`.

---

### Test 2B: Department Creation by Admin

#### Step 1: Action in Frontend
Logged in as Administrator (`admin@campus.test` / `password123`) and submitted a department creation request:
- **Name**: `Cybersecurity & Defense`
- **Code**: `CDEF56`
- **HOD ID**: `user-hod-ce` (Dr. Kavita Rao)

#### Step 2: Response from Live Backend
```json
{
  "id": "dept-cdef56-6729",
  "name": "Cybersecurity & Defense",
  "code": "CDEF56",
  "hodId": "user-hod-ce",
  "hodName": "Dr. Kavita Rao",
  "facultyCount": 0,
  "studentCount": 0,
  "courseCount": 0
}
```

#### Step 3: Direct MySQL Verification
Executed SQL query in MySQL / phpMyAdmin:
```sql
USE campusconnect;
SELECT id, code, name, hod_id 
FROM departments 
WHERE code = 'CDEF56';
```

#### Observed MySQL Output:
```text
+------------------+--------+-------------------------+-------------+
| id               | code   | name                    | hod_id      |
+------------------+--------+-------------------------+-------------+
| dept-cdef56-6729 | CDEF56 | Cybersecurity & Defense | user-hod-ce |
+------------------+--------+-------------------------+-------------+
1 row in set (0.000 sec)
```
- **Outcome**: **PASS** — Department row persisted in MySQL table `departments`.

---

## 4. How to Repeat This Exact Demo for Faculty

1. Ensure XAMPP MySQL is running (`http://localhost/phpmyadmin`).
2. Start the backend:
   ```bash
   cd campusconnect-backend
   mvn spring-boot:run
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000/login` in the browser, log in with `neha@campus.test` / `password123`.
5. Note the class title on screen: `"Advanced Full-Stack Engineering (CE-A)"`.
6. Switch to phpMyAdmin (`http://localhost/phpmyadmin` $\rightarrow$ database `campusconnect` $\rightarrow$ table `classrooms`).
7. Double-click the `title` column of `class-1`, type `"Machine Learning Engineering (CE-A)"`, and press Enter.
8. Switch back to the browser tab and press `F5` / Refresh.
9. Notice the card title updates to `"Machine Learning Engineering (CE-A)"` immediately.
10. To demo the other direction: Click **Create Class**, enter Title `"Quantum Computing (CE-Q)"` and Section `"Q"`, click Submit. Return to phpMyAdmin, refresh the `classrooms` table, and point out the newly inserted row.
