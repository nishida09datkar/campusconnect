package com.campusconnect.controller;

import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
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

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<java.util.List<User>> getAllUsers(
            @RequestParam(required = false) com.campusconnect.entity.Role role,
            @RequestParam(required = false) String departmentId
    ) {
        if (role != null && departmentId != null) {
            return ResponseEntity.ok(userRepository.findByDepartmentId(departmentId).stream()
                    .filter(u -> u.getRole() == role)
                    .collect(java.util.stream.Collectors.toList()));
        } else if (role != null) {
            return ResponseEntity.ok(userRepository.findByRole(role));
        } else if (departmentId != null) {
            return ResponseEntity.ok(userRepository.findByDepartmentId(departmentId));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<com.campusconnect.dto.user.UserDto> getUserById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(com.campusconnect.dto.user.UserDto::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
