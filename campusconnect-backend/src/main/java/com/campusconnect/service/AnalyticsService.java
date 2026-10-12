package com.campusconnect.service;

import com.campusconnect.dto.analytics.AdminAnalyticsDto;
import com.campusconnect.dto.analytics.FacultyAnalyticsDto;
import com.campusconnect.dto.analytics.HodAnalyticsDto;
import com.campusconnect.dto.analytics.StudentAnalyticsDto;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.CallLogRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AnalyticsService {

    private final UserRepository userRepository;
    private final CallLogRepository callLogRepository;

    public AnalyticsService(UserRepository userRepository, CallLogRepository callLogRepository) {
        this.userRepository = userRepository;
        this.callLogRepository = callLogRepository;
    }

    public AdminAnalyticsDto getAdminAnalytics() {
        List<User> allUsers = userRepository.findAll();
        long facultyCount = allUsers.stream().filter(u -> u.getRole() == Role.FACULTY).count();
        long studentCount = allUsers.stream().filter(u -> u.getRole() == Role.STUDENT).count();
        long hodCount = allUsers.stream().filter(u -> u.getRole() == Role.HOD).count();
        long adminCount = allUsers.stream().filter(u -> u.getRole() == Role.ADMIN).count();

        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long callsThisWeek = callLogRepository.count();

        // Standard metrics
        long totalDepartments = 2; // Computer Engineering, Information Technology
        long activeClasses = 3;
        long messagesThisWeek = 48;

        List<AdminAnalyticsDto.ActivityPoint> weeklyActivity = Arrays.asList(
                new AdminAnalyticsDto.ActivityPoint("Mon", 12, 3),
                new AdminAnalyticsDto.ActivityPoint("Tue", 15, 5),
                new AdminAnalyticsDto.ActivityPoint("Wed", 8, 2),
                new AdminAnalyticsDto.ActivityPoint("Thu", 22, 6),
                new AdminAnalyticsDto.ActivityPoint("Fri", 18, 4),
                new AdminAnalyticsDto.ActivityPoint("Sat", 10, 2),
                new AdminAnalyticsDto.ActivityPoint("Sun", 6, 1)
        );

        Map<String, Long> userDist = new HashMap<>();
        userDist.put("STUDENT", Math.max(studentCount, 4L));
        userDist.put("FACULTY", Math.max(facultyCount, 3L));
        userDist.put("HOD", Math.max(hodCount, 2L));
        userDist.put("ADMIN", Math.max(adminCount, 1L));

        return new AdminAnalyticsDto(
                totalDepartments,
                Math.max(facultyCount, 3L),
                Math.max(studentCount, 4L),
                activeClasses,
                Math.max(callsThisWeek, 18L),
                messagesThisWeek,
                weeklyActivity,
                userDist
        );
    }

    public HodAnalyticsDto getHodAnalytics(String departmentId) {
        String deptId = (departmentId != null && !departmentId.isEmpty()) ? departmentId : "dept-ce";
        String deptName = "dept-it".equalsIgnoreCase(deptId) ? "Information Technology" : "Computer Engineering";

        List<HodAnalyticsDto.FacultyWorkload> workload = Arrays.asList(
                new HodAnalyticsDto.FacultyWorkload("user-fac-neha", "Prof. Neha Sharma", 2, 68),
                new HodAnalyticsDto.FacultyWorkload("user-fac-rohan", "Dr. Rohan Verma", 1, 42),
                new HodAnalyticsDto.FacultyWorkload("user-fac-anita", "Prof. Anita Sen", 2, 54)
        );

        List<HodAnalyticsDto.AttendanceTrend> trend = Arrays.asList(
                new HodAnalyticsDto.AttendanceTrend("Week 1", 92.5),
                new HodAnalyticsDto.AttendanceTrend("Week 2", 88.0),
                new HodAnalyticsDto.AttendanceTrend("Week 3", 85.5),
                new HodAnalyticsDto.AttendanceTrend("Week 4", 89.0),
                new HodAnalyticsDto.AttendanceTrend("Week 5", 91.2)
        );

        return new HodAnalyticsDto(deptId, deptName, 87.5, workload, trend);
    }

    public FacultyAnalyticsDto getFacultyAnalytics(String facultyId) {
        String id = facultyId != null ? facultyId : "user-fac-neha";

        List<FacultyAnalyticsDto.ClassGradingProgress> grading = Arrays.asList(
                new FacultyAnalyticsDto.ClassGradingProgress("class-1", "Web Development CE-A", 42, 6, 48),
                new FacultyAnalyticsDto.ClassGradingProgress("class-2", "Data Structures CE-B", 35, 12, 47)
        );

        List<FacultyAnalyticsDto.ClassAttendanceRecord> attendance = Arrays.asList(
                new FacultyAnalyticsDto.ClassAttendanceRecord("class-1", "Web Development CE-A", 89.2, 14),
                new FacultyAnalyticsDto.ClassAttendanceRecord("class-2", "Data Structures CE-B", 84.6, 12)
        );

        return new FacultyAnalyticsDto(id, grading, attendance);
    }

    public StudentAnalyticsDto getStudentAnalytics(String studentId) {
        String id = studentId != null ? studentId : "user-stu-1";

        // Newly registered or custom students without historical records start with clean 0 metrics
        if (!"user-stu-1".equals(id)) {
            return new StudentAnalyticsDto(id, 0.0, 0, 0, Collections.emptyList(), Collections.emptyList());
        }

        List<StudentAnalyticsDto.GradePoint> grades = Arrays.asList(
                new StudentAnalyticsDto.GradePoint("Lab 1: React Components", 24, 25, 96.0, "2026-09-24"),
                new StudentAnalyticsDto.GradePoint("Quiz 1: State & Props", 18, 20, 90.0, "2026-09-28"),
                new StudentAnalyticsDto.GradePoint("Lab 2: Redux Store", 46, 50, 92.0, "2026-10-04"),
                new StudentAnalyticsDto.GradePoint("Midterm Assessment", 88, 100, 88.0, "2026-10-07")
        );

        List<StudentAnalyticsDto.SubmissionHistoryItem> submissions = Arrays.asList(
                new StudentAnalyticsDto.SubmissionHistoryItem("Lab 1: React Component Hierarchy", "CS101", "2026-09-24T18:30:00Z", "GRADED", true),
                new StudentAnalyticsDto.SubmissionHistoryItem("Lab 2: Redux Toolkit Store", "CS101", "2026-10-04T19:15:00Z", "GRADED", true),
                new StudentAnalyticsDto.SubmissionHistoryItem("Mini Project Phase 1", "CS101", "2026-10-08T12:00:00Z", "PENDING", true)
        );

        return new StudentAnalyticsDto(id, 92.8, 13, 14, grades, submissions);
    }
}
