package com.campusconnect.controller;

import com.campusconnect.dto.academic.ClassMembersResponse;
import com.campusconnect.dto.academic.ClassResponse;
import com.campusconnect.dto.academic.CreateClassRequest;
import com.campusconnect.dto.academic.JoinClassRequest;
import com.campusconnect.service.ClassRoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class ClassRoomController {

    private final ClassRoomService classRoomService;

    public ClassRoomController(ClassRoomService classRoomService) {
        this.classRoomService = classRoomService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ClassResponse>> getClasses(
            @RequestParam(required = false) String facultyId,
            @RequestParam(required = false) String studentId
    ) {
        return ResponseEntity.ok(classRoomService.getClasses(facultyId, studentId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ClassResponse> getClassById(@PathVariable String id) {
        return ResponseEntity.ok(classRoomService.getClassById(id));
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ClassMembersResponse> getClassMembers(@PathVariable String id) {
        return ResponseEntity.ok(classRoomService.getClassMembers(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    public ResponseEntity<ClassResponse> createClass(
            @RequestBody CreateClassRequest req,
            Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(classRoomService.createClass(currentUserId, req));
    }

    @PostMapping("/join")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ClassResponse> joinClass(
            @RequestBody JoinClassRequest req,
            Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        return ResponseEntity.ok(classRoomService.joinClassByCode(currentUserId, req.getClassCode()));
    }
}
