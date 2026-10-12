package com.campusconnect.controller;

import com.campusconnect.dto.academic.AllocationRequest;
import com.campusconnect.dto.academic.AllocationResponse;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.AllocationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/allocations")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class AllocationController {

    private final AllocationService allocationService;
    private final UserRepository userRepository;

    public AllocationController(AllocationService allocationService, UserRepository userRepository) {
        this.allocationService = allocationService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AllocationResponse>> getAllocations(
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String facultyId
    ) {
        return ResponseEntity.ok(allocationService.getAllocations(departmentId, facultyId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<AllocationResponse> createAllocation(
            @RequestBody AllocationRequest req,
            Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        User currentUser = userRepository.findById(currentUserId).orElse(null);
        String hodDeptId = null;
        if (currentUser != null && "HOD".equalsIgnoreCase(currentUser.getRole().name())) {
            hodDeptId = currentUser.getDepartmentId();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(allocationService.createAllocation(req, hodDeptId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOD')")
    public ResponseEntity<Map<String, Object>> deleteAllocation(@PathVariable String id) {
        allocationService.deleteAllocation(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
