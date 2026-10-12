package com.campusconnect.controller;

import com.campusconnect.dto.user.CreateUserRequest;
import com.campusconnect.dto.user.UpdateUserRequest;
import com.campusconnect.dto.user.UserDto;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        List<User> all = userRepository.findAll();
        Stream<User> stream = all.stream();

        if (role != null) {
            stream = stream.filter(u -> u.getRole() == role);
        }
        if (departmentId != null && !departmentId.isBlank()) {
            stream = stream.filter(u -> departmentId.equals(u.getDepartmentId()));
        }
        if (q != null && !q.trim().isEmpty()) {
            String search = q.trim().toLowerCase();
            stream = stream.filter(u ->
                    (u.getName() != null && u.getName().toLowerCase().contains(search)) ||
                    (u.getEmail() != null && u.getEmail().toLowerCase().contains(search)) ||
                    (u.getRollNo() != null && u.getRollNo().toLowerCase().contains(search)) ||
                    (u.getEmployeeId() != null && u.getEmployeeId().toLowerCase().contains(search)) ||
                    (u.getDesignation() != null && u.getDesignation().toLowerCase().contains(search))
            );
        }

        List<UserDto> filtered = stream.map(UserDto::from).toList();
        int total = filtered.size();
        int safePage = Math.max(1, page);
        int safePageSize = Math.max(1, pageSize);
        int start = Math.min((safePage - 1) * safePageSize, total);
        int end = Math.min(start + safePageSize, total);
        List<UserDto> items = (start <= end) ? filtered.subList(start, end) : List.of();

        return ResponseEntity.ok(Map.of(
                "items", items,
                "total", total,
                "page", safePage,
                "pageSize", safePageSize
        ));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "User with email '" + email + "' already exists."));
        }

        String idPrefix = switch (request.getRole()) {
            case ADMIN -> "admin";
            case HOD -> "hod";
            case FACULTY -> "fac";
            case STUDENT -> "stu";
            default -> "user";
        };
        String newId = "user-" + idPrefix + "-" + (System.currentTimeMillis() % 1000000);

        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            rawPassword = switch (request.getRole()) {
                case ADMIN -> "Admin@123";
                case HOD -> "Hod@123";
                case FACULTY -> "Fac@123";
                case STUDENT -> "Stu@123";
                default -> "Password@123";
            };
        }

        User user = new User();
        user.setId(newId);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword.trim()));
        user.setName(request.getName().trim());
        user.setRole(request.getRole());
        user.setDepartmentId(request.getDepartmentId() != null && !request.getDepartmentId().isBlank() ? request.getDepartmentId() : null);
        user.setActive(request.getActive() != null ? request.getActive() : true);
        user.setRollNo(request.getRollNo() != null ? request.getRollNo().trim() : null);
        user.setYear(request.getYear());
        user.setDivision(request.getDivision());
        user.setEmployeeId(request.getEmployeeId() != null ? request.getEmployeeId().trim() : null);
        user.setDesignation(request.getDesignation() != null ? request.getDesignation().trim() : null);
        user.setAvatar(request.getAvatarUrl());

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDto.from(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody UpdateUserRequest request) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        if (request.getEmail() != null) {
            String email = request.getEmail().trim().toLowerCase();
            Optional<User> existing = userRepository.findByEmail(email);
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email '" + email + "' is already in use."));
            }
            user.setEmail(email);
        }

        if (request.getName() != null) user.setName(request.getName().trim());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getDepartmentId() != null) {
            user.setDepartmentId(request.getDepartmentId().isBlank() ? null : request.getDepartmentId());
        }
        if (request.getActive() != null) user.setActive(request.getActive());
        if (request.getRollNo() != null) user.setRollNo(request.getRollNo().trim());
        if (request.getYear() != null) user.setYear(request.getYear());
        if (request.getDivision() != null) user.setDivision(request.getDivision());
        if (request.getEmployeeId() != null) user.setEmployeeId(request.getEmployeeId().trim());
        if (request.getDesignation() != null) user.setDesignation(request.getDesignation().trim());
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(UserDto.from(updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleUserStatus(@PathVariable String id, @RequestBody(required = false) Map<String, Boolean> body) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        if (body != null && body.containsKey("isActive")) {
            user.setActive(Boolean.TRUE.equals(body.get("isActive")));
        } else {
            user.setActive(!user.isActive());
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(UserDto.from(updated));
    }

    @GetMapping("/{id}/can-interact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> canInteract(
            @PathVariable String id,
            Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        // Disallow self-call
        if (id.equals(currentUserId)) {
            return ResponseEntity.ok(Map.of("allowed", false, "reason", "Cannot call self"));
        }

        // Check target exists
        boolean exists = userRepository.existsById(id);
        if (!exists) {
            return ResponseEntity.ok(Map.of("allowed", false, "reason", "Target user not found"));
        }

        // Institutional permission logic: allows communication across active members
        return ResponseEntity.ok(Map.of("allowed", true));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> getUserById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(UserDto::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
