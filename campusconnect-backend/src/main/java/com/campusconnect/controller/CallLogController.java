package com.campusconnect.controller;

import com.campusconnect.dto.call.CallLogRequest;
import com.campusconnect.dto.call.CallLogResponse;
import com.campusconnect.entity.CallOutcome;
import com.campusconnect.service.CallLogService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/calls/logs")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class CallLogController {

    private final CallLogService callLogService;

    public CallLogController(CallLogService callLogService) {
        this.callLogService = callLogService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CallLogResponse> createCallLog(
            @Valid @RequestBody CallLogRequest request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : request.getCallerId();
        CallLogResponse response = callLogService.createCallLog(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CallLogResponse>> getCallLogs(
            @RequestParam(required = false) CallOutcome outcome,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        List<CallLogResponse> logs = callLogService.getUserCallLogs(currentUserId, outcome, startDate, endDate);
        return ResponseEntity.ok(logs);
    }
}
