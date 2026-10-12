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
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      DepartmentRepository departmentRepository,
                      CourseRepository courseRepository,
                      ClassRoomRepository classRoomRepository,
                      EnrollmentRepository enrollmentRepository,
                      FacultyAllocationRepository allocationRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.classRoomRepository = classRoomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.allocationRepository = allocationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String encodedPassword = passwordEncoder.encode("password123");

        // 1. Seed Demo Users matching src/api/mock/db.ts
        List<User> demoUsers = List.of(
                new User("user-admin", "admin@campus.test", encodedPassword, "Aarav Mehta", Role.ADMIN, "dept-admin"),
                new User("user-admin-2", "admin@campusconnect.edu", encodedPassword, "Campus Admin", Role.ADMIN, "dept-admin"),
                new User("user-hod-ce", "hod.ce@campus.test", encodedPassword, "Dr. Kavita Rao", Role.HOD, "dept-ce"),
                new User("user-hod-it", "hod.it@campus.test", encodedPassword, "Dr. Sameer Joshi", Role.HOD, "dept-it"),
                new User("user-fac-neha", "neha@campus.test", encodedPassword, "Prof. Neha Kulkarni", Role.FACULTY, "dept-ce"),
                new User("user-fac-rohan", "rohan@campus.test", encodedPassword, "Prof. Rohan Desai", Role.FACULTY, "dept-ce"),
                new User("user-fac-anita", "anita@campus.test", encodedPassword, "Prof. Anita Patil", Role.FACULTY, "dept-ce"),
                new User("user-fac-vivek", "vivek@campus.test", encodedPassword, "Prof. Vivek Shah", Role.FACULTY, "dept-it"),
                new User("user-fac-sara", "sara@campus.test", encodedPassword, "Prof. Sara Khan", Role.FACULTY, "dept-it"),
                new User("user-stu-1", "student1@campus.test", encodedPassword, "Aarav Sharma", Role.STUDENT, "dept-ce"),
                new User("user-stu-2", "student2@campus.test", encodedPassword, "Diya Patel", Role.STUDENT, "dept-ce"),
                new User("user-stu-3", "student3@campus.test", encodedPassword, "Ananya Verma", Role.STUDENT, "dept-ce"),
                new User("user-stu-4", "student4@campus.test", encodedPassword, "Ishaan Singh", Role.STUDENT, "dept-ce"),
                new User("user-stu-5", "student5@campus.test", encodedPassword, "Rohan Gupta", Role.STUDENT, "dept-ce"),
                new User("user-stu-6", "student6@campus.test", encodedPassword, "Sneha Nair", Role.STUDENT, "dept-ce"),
                new User("user-stu-7", "student7@campus.test", encodedPassword, "Siddharth Joshi", Role.STUDENT, "dept-ce"),
                new User("user-stu-8", "student8@campus.test", encodedPassword, "Tanvi Deshmukh", Role.STUDENT, "dept-ce"),
                new User("user-stu-9", "student9@campus.test", encodedPassword, "Kabir Mehta", Role.STUDENT, "dept-it"),
                new User("user-stu-10", "student10@campus.test", encodedPassword, "Pooja Reddy", Role.STUDENT, "dept-it"),
                new User("user-stu-11", "student11@campus.test", encodedPassword, "Aditya Kulkarni", Role.STUDENT, "dept-it"),
                new User("user-stu-12", "student12@campus.test", encodedPassword, "Riya Sen", Role.STUDENT, "dept-it")
        );

        for (User u : demoUsers) {
            userRepository.findByEmail(u.getEmail()).ifPresentOrElse(existing -> {
                if (!existing.getId().equals(u.getId())) {
                    userRepository.delete(existing);
                    userRepository.flush();
                    userRepository.save(u);
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

        System.out.println(">>> Demo data (users, departments, courses, allocations, classes, enrollments) successfully synced into MySQL.");
    }
}
