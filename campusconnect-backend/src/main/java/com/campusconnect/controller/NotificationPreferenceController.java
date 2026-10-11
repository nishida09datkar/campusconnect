package com.campusconnect.controller;

import com.campusconnect.dto.notification.EmailSendResult;
import com.campusconnect.dto.notification.NotificationPreferenceDto;
import com.campusconnect.entity.NotificationPreference;
import com.campusconnect.repository.NotificationPreferenceRepository;
import com.campusconnect.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class NotificationPreferenceController {

    private final NotificationPreferenceRepository preferenceRepository;
    private final EmailService emailService;

    public NotificationPreferenceController(
            NotificationPreferenceRepository preferenceRepository,
            EmailService emailService
    ) {
        this.preferenceRepository = preferenceRepository;
        this.emailService = emailService;
    }

    @GetMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationPreferenceDto> getPreferences(Authentication authentication) {
        String userId = authentication.getName();
        NotificationPreference pref = preferenceRepository.findById(userId)
                .orElseGet(() -> preferenceRepository.save(new NotificationPreference(userId)));
        return ResponseEntity.ok(NotificationPreferenceDto.from(pref));
    }

    @PutMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationPreferenceDto> updatePreferences(
            @RequestBody NotificationPreferenceDto dto,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        NotificationPreference pref = preferenceRepository.findById(userId)
                .orElseGet(() -> new NotificationPreference(userId));

        pref.setEmailNotifications(dto.isEmailNotifications());
        pref.setInAppNotifications(dto.isInAppNotifications());
        pref.setAssignmentAlerts(dto.isAssignmentAlerts());
        pref.setAnnouncementAlerts(dto.isAnnouncementAlerts());
        pref.setMeetingAlerts(dto.isMeetingAlerts());
        pref.setChatAlerts(dto.isChatAlerts());
        pref.setAttendanceAlerts(dto.isAttendanceAlerts());
        if (dto.getDigestFrequency() != null) {
            pref.setDigestFrequency(dto.getDigestFrequency());
        }
        pref.setUpdatedAt(LocalDateTime.now());

        NotificationPreference saved = preferenceRepository.save(pref);
        return ResponseEntity.ok(NotificationPreferenceDto.from(saved));
    }

    @PostMapping("/test-email")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EmailSendResult> sendTestEmail(Authentication authentication) {
        String userId = authentication.getName();
        EmailSendResult result = emailService.sendTestEmail(userId);
        return ResponseEntity.ok(result);
    }
}
