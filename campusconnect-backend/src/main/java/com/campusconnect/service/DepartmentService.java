package com.campusconnect.service;

import com.campusconnect.dto.academic.DepartmentRequest;
import com.campusconnect.dto.academic.DepartmentResponse;
import com.campusconnect.entity.Department;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.CourseRepository;
import com.campusconnect.repository.DepartmentRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public DepartmentService(DepartmentRepository departmentRepository,
                             UserRepository userRepository,
                             CourseRepository courseRepository) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::enrich)
                .collect(Collectors.toList());
    }

    public DepartmentResponse getDepartmentById(String id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        return enrich(dept);
    }

    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest req) {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department name is required");
        }
        if (req.getCode() == null || req.getCode().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department code is required");
        }

        String code = req.getCode().trim().toUpperCase();
        String name = req.getName().trim();

        if (departmentRepository.existsByCodeIgnoreCase(code) || departmentRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department with code '" + code + "' or name '" + name + "' already exists");
        }

        String id = "dept-" + code.toLowerCase() + "-" + (System.currentTimeMillis() % 10000);
        Department dept = new Department(id, name, code, req.getHodId());
        departmentRepository.save(dept);

        if (req.getHodId() != null && !req.getHodId().trim().isEmpty()) {
            userRepository.findById(req.getHodId()).ifPresent(user -> {
                user.setDepartmentId(dept.getId());
                userRepository.save(user);
            });
        }

        return enrich(dept);
    }

    @Transactional
    public DepartmentResponse updateDepartment(String id, DepartmentRequest req) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        if (req.getCode() != null && !req.getCode().trim().isEmpty()) {
            String code = req.getCode().trim().toUpperCase();
            Optional<Department> existing = departmentRepository.findByCodeIgnoreCase(code);
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department code '" + code + "' is already used");
            }
            dept.setCode(code);
        }

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            dept.setName(req.getName().trim());
        }

        if (req.getHodId() != null) {
            dept.setHodId(req.getHodId());
            if (!req.getHodId().trim().isEmpty()) {
                userRepository.findById(req.getHodId()).ifPresent(user -> {
                    user.setDepartmentId(id);
                    userRepository.save(user);
                });
            }
        }

        departmentRepository.save(dept);
        return enrich(dept);
    }

    @Transactional
    public void deleteDepartment(String id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found");
        }
        departmentRepository.deleteById(id);
    }

    public DepartmentResponse enrich(Department dept) {
        User hod = null;
        if (dept.getHodId() != null) {
            hod = userRepository.findById(dept.getHodId()).orElse(null);
        }

        List<User> users = userRepository.findAll();
        int facultyCount = (int) users.stream()
                .filter(u -> dept.getId().equals(u.getDepartmentId()) && u.getRole() == Role.FACULTY)
                .count();
        int studentCount = (int) users.stream()
                .filter(u -> dept.getId().equals(u.getDepartmentId()) && u.getRole() == Role.STUDENT)
                .count();
        int courseCount = courseRepository.findByDepartmentId(dept.getId()).size();

        return new DepartmentResponse(
                dept.getId(),
                dept.getName(),
                dept.getCode(),
                dept.getHodId(),
                hod != null ? hod.getName() : "Unassigned",
                hod != null ? hod.getEmail() : null,
                facultyCount,
                studentCount,
                courseCount
        );
    }
}
