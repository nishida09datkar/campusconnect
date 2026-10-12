package com.campusconnect.config;

import com.campusconnect.entity.*;
import com.campusconnect.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final ClassRoomRepository classRoomRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FacultyAllocationRepository allocationRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      DepartmentRepository departmentRepository,
                      CourseRepository courseRepository,
                      ClassRoomRepository classRoomRepository,
                      EnrollmentRepository enrollmentRepository,
                      FacultyAllocationRepository allocationRepository,
                      CalendarEventRepository calendarEventRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.classRoomRepository = classRoomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.allocationRepository = allocationRepository;
        this.calendarEventRepository = calendarEventRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String encodedPassword = passwordEncoder.encode("password123");
        String adminPassword = passwordEncoder.encode("Admin@123");
        String hodPassword = passwordEncoder.encode("Hod@123");
        String facPassword = passwordEncoder.encode("Fac@123");
        String stuPassword = passwordEncoder.encode("Stu@123");

        // 1. Seed Demo Users matching src/api/mock/db.ts
        List<User> demoUsers = List.of(
                new User("user-admin", "admin@campus.test", adminPassword, "Aarav Mehta", Role.ADMIN, "dept-admin"),
                new User("user-admin-2", "admin@campusconnect.edu", adminPassword, "Campus Admin", Role.ADMIN, "dept-admin"),
                new User("user-hod-ce", "hod.ce@campus.test", hodPassword, "Dr. Kavita Rao", Role.HOD, "dept-ce"),
                new User("user-hod-it", "hod.it@campus.test", hodPassword, "Dr. Sameer Joshi", Role.HOD, "dept-it"),
                new User("user-fac-neha", "neha@campus.test", facPassword, "Prof. Neha Kulkarni", Role.FACULTY, "dept-ce"),
                new User("user-fac-rohan", "rohan@campus.test", facPassword, "Prof. Rohan Desai", Role.FACULTY, "dept-ce"),
                new User("user-fac-anita", "anita@campus.test", facPassword, "Prof. Anita Patil", Role.FACULTY, "dept-ce"),
                new User("user-fac-vivek", "vivek@campus.test", facPassword, "Prof. Vivek Shah", Role.FACULTY, "dept-it"),
                new User("user-fac-sara", "sara@campus.test", facPassword, "Prof. Sara Khan", Role.FACULTY, "dept-it"),
                student("user-stu-1", "student1@campus.test", stuPassword, "Aarav Sharma", "dept-ce", 3),
                student("user-stu-2", "student2@campus.test", stuPassword, "Diya Patel", "dept-ce", 3),
                student("user-stu-3", "student3@campus.test", stuPassword, "Ananya Verma", "dept-ce", 3),
                student("user-stu-4", "student4@campus.test", stuPassword, "Ishaan Singh", "dept-ce", 3),
                student("user-stu-5", "student5@campus.test", stuPassword, "Rohan Gupta", "dept-ce", 3),
                student("user-stu-6", "student6@campus.test", stuPassword, "Sneha Nair", "dept-ce", 3),
                student("user-stu-7", "student7@campus.test", stuPassword, "Siddharth Joshi", "dept-ce", 3),
                student("user-stu-8", "student8@campus.test", stuPassword, "Tanvi Deshmukh", "dept-ce", 3),
                student("user-stu-9", "student9@campus.test", stuPassword, "Kabir Mehta", "dept-it", 2),
                student("user-stu-10", "student10@campus.test", stuPassword, "Pooja Reddy", "dept-it", 2),
                student("user-stu-11", "student11@campus.test", stuPassword, "Aditya Kulkarni", "dept-it", 2),
                student("user-stu-12", "student12@campus.test", stuPassword, "Riya Sen", "dept-it", 2)
        );

        for (User u : demoUsers) {
            userRepository.findByEmail(u.getEmail()).ifPresentOrElse(existing -> {
                if (!existing.getId().equals(u.getId())) {
                    userRepository.delete(existing);
                    userRepository.flush();
                    userRepository.save(u);
                } else {
                    existing.setPassword(u.getPassword());
                    existing.setName(u.getName());
                    existing.setRole(u.getRole());
                    existing.setDepartmentId(u.getDepartmentId());
                    userRepository.save(existing);
                }
            }, () -> {
                if (!userRepository.existsById(u.getId())) {
                    userRepository.save(u);
                }
            });
        }
        userRepository.flush();

        // 2. Seed Departments
        if (departmentRepository.count() == 0) {
            departmentRepository.saveAll(List.of(
                    new Department("dept-ce", "Computer Engineering", "CE", "user-hod-ce"),
                    new Department("dept-it", "Information Technology", "IT", "user-hod-it")
            ));
            departmentRepository.flush();
        }

        // 3. Seed Courses
        if (courseRepository.count() == 0) {
            courseRepository.saveAll(List.of(
                    new Course("course-ce-301", "CE301", "Web Development", "dept-ce", 3),
                    new Course("course-ce-302", "CE302", "Database Systems", "dept-ce", 3),
                    new Course("course-ce-303", "CE303", "Java and Spring Framework", "dept-ce", 3),
                    new Course("course-it-201", "IT201", "Computer Networks", "dept-it", 2),
                    new Course("course-it-202", "IT202", "Data Structures and Algorithms", "dept-it", 2)
            ));
            courseRepository.flush();
        }

        // 4. Seed Faculty Allocations
        if (allocationRepository.count() == 0) {
            allocationRepository.saveAll(List.of(
                    new FacultyAllocation("alloc-1", "user-fac-neha", "course-ce-301"),
                    new FacultyAllocation("alloc-2", "user-fac-rohan", "course-ce-302"),
                    new FacultyAllocation("alloc-3", "user-fac-anita", "course-ce-303"),
                    new FacultyAllocation("alloc-4", "user-fac-vivek", "course-it-201"),
                    new FacultyAllocation("alloc-5", "user-fac-sara", "course-it-202")
            ));
            allocationRepository.flush();
        }

        // 5. Seed Classrooms
        if (classRoomRepository.count() == 0) {
            classRoomRepository.saveAll(List.of(
                    new ClassRoom("class-1", "course-ce-301", "Web Development (CE-A)", "A", "WEB3A1", "user-fac-neha", "from-indigo-600 to-purple-600"),
                    new ClassRoom("class-2", "course-ce-302", "Database Systems (CE-A)", "A", "DBS3A2", "user-fac-rohan", "from-blue-600 to-cyan-600"),
                    new ClassRoom("class-3", "course-ce-303", "Java and Spring (CE-B)", "B", "JAV3B1", "user-fac-anita", "from-amber-600 to-orange-600"),
                    new ClassRoom("class-4", "course-it-201", "Computer Networks (IT-A)", "A", "NET2A1", "user-fac-vivek", "from-emerald-600 to-teal-600"),
                    new ClassRoom("class-5", "course-it-202", "Data Structures (IT-A)", "A", "DSA2A1", "user-fac-sara", "from-rose-600 to-pink-600")
            ));
            classRoomRepository.flush();
        }

        // 6. Seed Enrollments
        if (enrollmentRepository.count() == 0) {
            enrollmentRepository.saveAll(List.of(
                    new Enrollment("enr-1", "user-stu-1", "class-1"),
                    new Enrollment("enr-2", "user-stu-2", "class-1"),
                    new Enrollment("enr-3", "user-stu-3", "class-1"),
                    new Enrollment("enr-4", "user-stu-4", "class-1"),
                    new Enrollment("enr-5", "user-stu-1", "class-2"),
                    new Enrollment("enr-6", "user-stu-2", "class-2"),
                    new Enrollment("enr-7", "user-stu-3", "class-2"),
                    new Enrollment("enr-8", "user-stu-4", "class-2"),
                    new Enrollment("enr-9", "user-stu-5", "class-3"),
                    new Enrollment("enr-10", "user-stu-6", "class-3"),
                    new Enrollment("enr-11", "user-stu-7", "class-3"),
                    new Enrollment("enr-12", "user-stu-8", "class-3"),
                    new Enrollment("enr-13", "user-stu-9", "class-4"),
                    new Enrollment("enr-14", "user-stu-10", "class-4"),
                    new Enrollment("enr-15", "user-stu-11", "class-4"),
                    new Enrollment("enr-16", "user-stu-9", "class-5"),
                    new Enrollment("enr-17", "user-stu-10", "class-5"),
                    new Enrollment("enr-18", "user-stu-11", "class-5"),
                    new Enrollment("enr-19", "user-stu-12", "class-5")
            ));
            enrollmentRepository.flush();
        }

        // 7. Seed Calendar Events
        if (calendarEventRepository.count() == 0) {
            CalendarEvent e1 = new CalendarEvent(
                    "evt-1",
                    "CE Department Curriculum Review Meeting",
                    "2026-10-08T10:00:00Z",
                    "2026-10-08T11:30:00Z",
                    "MEETING",
                    "user-hod-ce"
            );
            e1.setDescription("Discussion on Unit 3 syllabus coverage, lab benchmarks, and upcoming midterm evaluations.");
            e1.setDepartmentId("dept-ce");
            e1.setLocation("Seminar Hall B");
            e1.setParticipantIds("user-hod-ce,user-fac-neha,user-fac-anita");

            CalendarEvent e2 = new CalendarEvent(
                    "evt-2",
                    "Lab 2: Redux Toolkit Store Submission",
                    "2026-10-09T23:59:00Z",
                    "2026-10-09T23:59:00Z",
                    "ASSIGNMENT",
                    "user-fac-neha"
            );
            e2.setDescription("Submission deadline for Web Development Lab 2 (CE301).");
            e2.setClassId("class-1");
            e2.setCreatorId("user-fac-neha");
            e2.setDepartmentId("dept-ce");
            e2.setParticipantIds("user-fac-neha,user-stu-1,user-stu-2");
            e2.setLink("/student/classes/class-1");

            CalendarEvent e3 = new CalendarEvent(
                    "evt-3",
                    "Live Lecture: React Hooks & State Machines",
                    "2026-10-10T09:30:00Z",
                    "2026-10-10T10:45:00Z",
                    "LECTURE",
                    "user-fac-neha"
            );
            e3.setDescription("Interactive session on custom hooks, performance tuning, and memoization patterns.");
            e3.setClassId("class-1");
            e3.setDepartmentId("dept-ce");
            e3.setParticipantIds("user-fac-neha,user-stu-1,user-stu-2");
            e3.setLink("/lecture/room-ce-301");

            calendarEventRepository.saveAll(List.of(e1, e2, e3));
            System.out.println(">>> Initial calendar events seeded successfully.");
        }

        System.out.println(">>> Demo data (users, departments, courses, allocations, classes, enrollments, calendar) successfully synced into MySQL.");
    }

    private User student(String id, String email, String password, String name, String departmentId, int year) {
        User user = new User(id, email, password, name, Role.STUDENT, departmentId);
        user.setYear(year);
        return user;
    }
}
