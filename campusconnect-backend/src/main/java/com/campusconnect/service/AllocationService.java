package com.campusconnect.service;

import com.campusconnect.dto.academic.AllocationRequest;
import com.campusconnect.dto.academic.AllocationResponse;
import com.campusconnect.entity.Course;
import com.campusconnect.entity.FacultyAllocation;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.CourseRepository;
import com.campusconnect.repository.FacultyAllocationRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AllocationService {

    private final FacultyAllocationRepository allocationRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public AllocationService(FacultyAllocationRepository allocationRepository,
                             UserRepository userRepository,
                             CourseRepository courseRepository) {
        this.allocationRepository = allocationRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    public List<AllocationResponse> getAllocations(String departmentId, String facultyId) {
        List<FacultyAllocation> allocations;
        if (facultyId != null && !facultyId.trim().isEmpty()) {
            allocations = allocationRepository.findByFacultyId(facultyId.trim());
        } else {
            allocations = allocationRepository.findAll();
        }

        if (departmentId != null && !departmentId.trim().isEmpty()) {
            allocations = allocations.stream().filter(a -> {
                Course course = courseRepository.findById(a.getCourseId()).orElse(null);
                return course != null && departmentId.trim().equals(course.getDepartmentId());
            }).collect(Collectors.toList());
        }

        return allocations.stream().map(this::enrich).collect(Collectors.toList());
    }

    @Transactional
    public AllocationResponse createAllocation(AllocationRequest req, String hodDepartmentId) {
        if (req.getFacultyId() == null || req.getFacultyId().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Faculty ID is required");
        }
        if (req.getCourseId() == null || req.getCourseId().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course ID is required");
        }

        User faculty = userRepository.findById(req.getFacultyId().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Faculty member not found"));

        if (faculty.getRole() != Role.FACULTY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only faculty members can be allocated to courses");
        }

        Course course = courseRepository.findById(req.getCourseId().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (hodDepartmentId != null && !hodDepartmentId.trim().isEmpty()) {
            if (!hodDepartmentId.equals(course.getDepartmentId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot allocate courses outside your department");
            }
            if (!hodDepartmentId.equals(faculty.getDepartmentId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot allocate faculty outside your department");
            }
        }

        if (allocationRepository.existsByFacultyIdAndCourseId(faculty.getId(), course.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This faculty member is already allocated to this course");
        }

        String id = "alloc-" + (System.currentTimeMillis() % 1000000);
        FacultyAllocation alloc = new FacultyAllocation(id, faculty.getId(), course.getId());
        allocationRepository.save(alloc);

        return enrich(alloc);
    }

    @Transactional
    public void deleteAllocation(String id) {
        if (!allocationRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Allocation not found");
        }
        allocationRepository.deleteById(id);
    }

    public AllocationResponse enrich(FacultyAllocation a) {
        User faculty = userRepository.findById(a.getFacultyId()).orElse(null);
        Course course = courseRepository.findById(a.getCourseId()).orElse(null);

        return new AllocationResponse(
                a.getId(),
                a.getFacultyId(),
                a.getCourseId(),
                faculty != null ? faculty.getName() : null,
                faculty != null ? faculty.getEmail() : null,
                null,
                course != null ? course.getCode() : null,
                course != null ? course.getTitle() : null,
                course != null ? course.getYear() : null
        );
    }
}
