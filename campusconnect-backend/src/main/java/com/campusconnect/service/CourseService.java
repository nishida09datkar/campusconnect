package com.campusconnect.service;

import com.campusconnect.dto.academic.CourseRequest;
import com.campusconnect.dto.academic.CourseResponse;
import com.campusconnect.entity.Course;
import com.campusconnect.repository.CourseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<CourseResponse> getAllCourses(String departmentId) {
        List<Course> list;
        if (departmentId != null && !departmentId.trim().isEmpty()) {
            list = courseRepository.findByDepartmentId(departmentId.trim());
        } else {
            list = courseRepository.findAll();
        }
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public CourseResponse getCourseById(String id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        return toResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest req) {
        if (req.getCode() == null || req.getCode().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course code is required");
        }
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course title is required");
        }
        if (req.getDepartmentId() == null || req.getDepartmentId().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department ID is required");
        }

        String code = req.getCode().trim().toUpperCase();
        if (courseRepository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course with code '" + code + "' already exists");
        }

        String id = "course-" + code.toLowerCase().replaceAll("[^a-z0-9]", "-");
        Course course = new Course(
                id,
                code,
                req.getTitle().trim(),
                req.getDepartmentId().trim(),
                req.getYear() != null ? req.getYear() : 1
        );
        courseRepository.save(course);
        return toResponse(course);
    }

    public CourseResponse toResponse(Course c) {
        return new CourseResponse(c.getId(), c.getCode(), c.getTitle(), c.getDepartmentId(), c.getYear());
    }
}
