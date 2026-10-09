package com.campusconnect.config;

import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        String encodedPassword = passwordEncoder.encode("password123");

        List<User> demoUsers = List.of(
                new User("user-admin-1", "admin@campus.test", encodedPassword, "System Administrator", Role.ADMIN, "dept-admin"),
                new User("user-admin-2", "admin@campusconnect.edu", encodedPassword, "Campus Admin", Role.ADMIN, "dept-admin"),
                new User("user-hod-ce", "hod.ce@campus.test", encodedPassword, "Dr. Rajesh Sharma (HOD CE)", Role.HOD, "dept-ce"),
                new User("user-hod-comps", "hod.comps@campus.test", encodedPassword, "Dr. Sunita Rao (HOD Comps)", Role.HOD, "dept-comps"),
                new User("user-fac-1", "neha@campus.test", encodedPassword, "Prof. Neha Kulkarni", Role.FACULTY, "dept-ce"),
                new User("user-fac-2", "priya@campus.test", encodedPassword, "Prof. Priya Iyer", Role.FACULTY, "dept-comps"),
                new User("user-fac-3", "amit@campus.test", encodedPassword, "Prof. Amit Verma", Role.FACULTY, "dept-ce"),
                new User("user-stud-1", "student1@campus.test", encodedPassword, "Aarav Patel", Role.STUDENT, "dept-ce"),
                new User("user-stud-2", "student2@campus.test", encodedPassword, "Diya Mehta", Role.STUDENT, "dept-ce"),
                new User("user-stud-3", "student3@campus.test", encodedPassword, "Rohan Deshmukh", Role.STUDENT, "dept-comps")
        );

        userRepository.saveAll(demoUsers);
        System.out.println(">>> Demo users seeded successfully into CampusConnect MySQL/H2 database.");
    }
}
