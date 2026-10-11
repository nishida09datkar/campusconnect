package com.campusconnect.config;

import com.campusconnect.entity.CalendarEvent;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.CalendarEventRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CalendarEventRepository calendarEventRepository;

    public DataSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CalendarEventRepository calendarEventRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.calendarEventRepository = calendarEventRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            String adminPass = passwordEncoder.encode("Admin@123");
            String hodPass = passwordEncoder.encode("Hod@123");
            String facPass = passwordEncoder.encode("Fac@123");
            String stuPass = passwordEncoder.encode("Stu@123");

            List<User> demoUsers = new ArrayList<>();
            demoUsers.add(new User("user-admin", "admin@campus.test", adminPass, "Aarav Mehta", Role.ADMIN, null));

            demoUsers.add(new User("user-hod-ce", "hod.ce@campus.test", hodPass, "Dr. Kavita Rao", Role.HOD, "dept-ce"));
            demoUsers.add(new User("user-hod-it", "hod.it@campus.test", hodPass, "Dr. Sameer Joshi", Role.HOD, "dept-it"));

            demoUsers.add(new User("user-fac-neha", "neha@campus.test", facPass, "Prof. Neha Kulkarni", Role.FACULTY, "dept-ce"));
            demoUsers.add(new User("user-fac-rohan", "rohan@campus.test", facPass, "Prof. Rohan Desai", Role.FACULTY, "dept-ce"));
            demoUsers.add(new User("user-fac-anita", "anita@campus.test", facPass, "Prof. Anita Patil", Role.FACULTY, "dept-ce"));
            demoUsers.add(new User("user-fac-vivek", "vivek@campus.test", facPass, "Prof. Vivek Shah", Role.FACULTY, "dept-it"));
            demoUsers.add(new User("user-fac-sara", "sara@campus.test", facPass, "Prof. Sara Khan", Role.FACULTY, "dept-it"));

            demoUsers.add(student("user-stu-1", "student1@campus.test", stuPass, "Aryan Sharma", "dept-ce", 3));
            demoUsers.add(student("user-stu-2", "student2@campus.test", stuPass, "Diya Patel", "dept-ce", 3));
            demoUsers.add(student("user-stu-3", "student3@campus.test", stuPass, "Ishaan Verma", "dept-ce", 3));
            demoUsers.add(student("user-stu-4", "student4@campus.test", stuPass, "Ananya Iyer", "dept-ce", 3));
            demoUsers.add(student("user-stu-5", "student5@campus.test", stuPass, "Rohan Gupta", "dept-ce", 3));
            demoUsers.add(student("user-stu-6", "student6@campus.test", stuPass, "Sneha Nair", "dept-ce", 3));
            demoUsers.add(student("user-stu-7", "student7@campus.test", stuPass, "Siddharth Joshi", "dept-ce", 3));
            demoUsers.add(student("user-stu-8", "student8@campus.test", stuPass, "Tanvi Deshmukh", "dept-ce", 3));
            demoUsers.add(student("user-stu-9", "student9@campus.test", stuPass, "Kabir Mehta", "dept-it", 2));
            demoUsers.add(student("user-stu-10", "student10@campus.test", stuPass, "Pooja Reddy", "dept-it", 2));
            demoUsers.add(student("user-stu-11", "student11@campus.test", stuPass, "Aditya Kulkarni", "dept-it", 2));
            demoUsers.add(student("user-stu-12", "student12@campus.test", stuPass, "Riya Sen", "dept-it", 2));

            userRepository.saveAll(demoUsers);
            System.out.println(">>> Demo users seeded successfully into CampusConnect database.");
        }

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
    }

    private User student(String id, String email, String password, String name, String departmentId, int year) {
        User user = new User(id, email, password, name, Role.STUDENT, departmentId);
        user.setYear(year);
        return user;
    }
}
