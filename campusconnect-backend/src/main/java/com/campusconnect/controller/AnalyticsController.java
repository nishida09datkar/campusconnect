package com.campusconnect.controller;

import com.campusconnect.dto.analytics.AdminAnalyticsDto;
import com.campusconnect.dto.analytics.FacultyAnalyticsDto;
import com.campusconnect.dto.analytics.HodAnalyticsDto;
import com.campusconnect.dto.analytics.StudentAnalyticsDto;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public AnalyticsController(AnalyticsService analyticsService, UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminAnalyticsDto> getAdminAnalytics() {
        AdminAnalyticsDto dto = analyticsService.getAdminAnalytics();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/hod")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<HodAnalyticsDto> getHodAnalytics(
            @RequestParam(required = false) String departmentId,
            Authentication authentication
    ) {
        if (authentication != null) {
            User currentUser = userRepository.findById(authentication.getName()).orElse(null);
            // HODs are restricted to their own department metrics; Admins can view any department
            if (currentUser != null && currentUser.getRole() == Role.HOD) {
                departmentId = currentUser.getDepartmentId();
            }
        }
        HodAnalyticsDto dto = analyticsService.getHodAnalytics(departmentId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<FacultyAnalyticsDto> getFacultyAnalytics(
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        FacultyAnalyticsDto dto = analyticsService.getFacultyAnalytics(currentUserId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentAnalyticsDto> getStudentAnalytics(
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        StudentAnalyticsDto dto = analyticsService.getStudentAnalytics(currentUserId);
        return ResponseEntity.ok(dto);
    }
}
