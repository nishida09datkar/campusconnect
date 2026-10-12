package com.campusconnect.controller;

import com.campusconnect.dto.academic.CourseRequest;
import com.campusconnect.dto.academic.CourseResponse;
import com.campusconnect.service.CourseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CourseResponse>> getAllCourses(
            @RequestParam(required = false) String departmentId
    ) {
        return ResponseEntity.ok(courseService.getAllCourses(departmentId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable String id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<CourseResponse> createCourse(@RequestBody CourseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(req));
    }
}
