package com.campusconnect.controller;

import com.campusconnect.dto.calendar.CalendarEventDto;
import com.campusconnect.entity.CalendarEvent;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.CalendarEventRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.EmailService;
import com.campusconnect.service.GoogleCalendarService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class CalendarController {

    private static final Pattern GOOGLE_MEET_PATTERN =
            Pattern.compile("^https://meet\\.google\\.com/[a-zA-Z0-9_-]+$");

    private final CalendarEventRepository calendarEventRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final GoogleCalendarService googleCalendarService;

    @Value("${campusconnect.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public CalendarController(
            CalendarEventRepository calendarEventRepository,
            UserRepository userRepository,
            EmailService emailService,
            GoogleCalendarService googleCalendarService
    ) {
        this.calendarEventRepository = calendarEventRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.googleCalendarService = googleCalendarService;
    }

    @GetMapping("/events")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CalendarEventDto>> getEvents(Authentication authentication) {
        String currentUserId = authentication.getName();
        User currentUser = userRepository.findById(currentUserId).orElse(null);

        List<CalendarEvent> allEvents = calendarEventRepository.findAll();
        List<CalendarEventDto> result = allEvents.stream()
                .filter(evt -> {
                    if (currentUser != null && currentUser.getRole() == Role.ADMIN) return true;
                    if (currentUserId.equals(evt.getCreatorId())) return true;
                    if (evt.getDepartmentId() != null && currentUser != null && evt.getDepartmentId().equals(currentUser.getDepartmentId())) return true;
                    if (evt.getParticipantIds() != null && evt.getParticipantIds().contains(currentUserId)) return true;
                    // Campus-wide general event
                    return evt.getDepartmentId() == null && evt.getClassId() == null && (evt.getParticipantIds() == null || evt.getParticipantIds().isEmpty());
                })
                .map(evt -> {
                    CalendarEventDto dto = CalendarEventDto.from(evt);
                    if (evt.getCreatorId() != null) {
                        userRepository.findById(evt.getCreatorId()).ifPresent(u -> dto.setCreatorName(u.getName()));
                    }
                    return dto;
                })
                .sorted(Comparator.comparing(CalendarEventDto::getStartTime))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/events")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createEvent(
            @Valid @RequestBody CalendarEventDto dto,
            Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        User currentUser = userRepository.findById(currentUserId).orElse(null);

        // Role authorization: students cannot schedule lectures, assignments, or quizzes
        if (currentUser != null && currentUser.getRole() == Role.STUDENT) {
            String type = dto.getType() != null ? dto.getType().toUpperCase() : "MEETING";
            if ("LECTURE".equals(type) || "ASSIGNMENT".equals(type) || "QUIZ".equals(type)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "Students are not authorized to create " + type + " calendar events"
                ));
            }
        }

        // Department access authorization: non-admin users cannot create events for another department
        if (dto.getDepartmentId() != null && !dto.getDepartmentId().trim().isEmpty()) {
            if (currentUser != null && currentUser.getRole() != Role.ADMIN) {
                if (!dto.getDepartmentId().equals(currentUser.getDepartmentId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                            "error", "You do not have permission to create events in department: " + dto.getDepartmentId()
                    ));
                }
            }
        }

        // Validate Google Meet URL format if explicitly provided
        if (dto.getMeetUrl() != null && !dto.getMeetUrl().trim().isEmpty()) {
            String meetUrl = dto.getMeetUrl().trim();
            if (!GOOGLE_MEET_PATTERN.matcher(meetUrl).matches()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Invalid Google Meet URL format. Must be in format https://meet.google.com/xxx-xxxx-xxx"
                ));
            }
            dto.setMeetUrl(meetUrl);
        }

        CalendarEvent event = new CalendarEvent();
        event.setId("evt-" + UUID.randomUUID().toString().substring(0, 8));
        event.setTitle(dto.getTitle().trim());
        event.setDescription(dto.getDescription());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setType(dto.getType() != null ? dto.getType() : "MEETING");
        event.setCreatorId(currentUserId);
        event.setDepartmentId(currentUser != null ? currentUser.getDepartmentId() : null);
        event.setClassId(dto.getClassId());
        event.setLocation(dto.getLocation() != null ? dto.getLocation() : "Campus Conference");
        event.setMeetUrl(dto.getMeetUrl());
        event.setLink(dto.getLink());

        if (dto.getParticipantIds() != null && !dto.getParticipantIds().isEmpty()) {
            Set<String> participants = new LinkedHashSet<>(dto.getParticipantIds());
            participants.add(currentUserId);
            event.setParticipantIds(String.join(",", participants));
        } else {
            event.setParticipantIds(currentUserId);
        }

        // Real Google Calendar synchronization & Google Meet creation if requested
        boolean attachMeet = Boolean.TRUE.equals(dto.getRequestGoogleMeet());
        if (googleCalendarService.isUserConnected(currentUserId)) {
            googleCalendarService.createGoogleCalendarEvent(currentUserId, event, attachMeet);
        }

        CalendarEvent saved = calendarEventRepository.save(event);

        // Send email notifications to invited participants
        if (dto.getParticipantIds() != null) {
            String creatorName = currentUser != null ? currentUser.getName() : "A colleague";
            for (String participantId : dto.getParticipantIds()) {
                if (!participantId.equals(currentUserId)) {
                    String meetText = event.getMeetUrl() != null ? " Google Meet Link: " + event.getMeetUrl() : "";
                    emailService.sendNotificationEmail(
                            participantId,
                            "MEETING",
                            "New Meeting: " + event.getTitle(),
                            "Meeting Invitation from " + creatorName,
                            "You have been invited to a meeting: " + event.getTitle() + " on " + event.getStartTime() + "." + meetText,
                            frontendUrl + "/calendar"
                    );
                }
            }
        }

        CalendarEventDto responseDto = CalendarEventDto.from(saved);
        if (currentUser != null) responseDto.setCreatorName(currentUser.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    @DeleteMapping("/events/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteEvent(
            @PathVariable String id,
            Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        User currentUser = userRepository.findById(currentUserId).orElse(null);

        Optional<CalendarEvent> opt = calendarEventRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CalendarEvent event = opt.get();
        boolean isCreator = currentUserId.equals(event.getCreatorId());
        boolean isAdmin = currentUser != null && currentUser.getRole() == Role.ADMIN;
        boolean isHodInSameDept = currentUser != null && currentUser.getRole() == Role.HOD
                && event.getDepartmentId() != null && event.getDepartmentId().equals(currentUser.getDepartmentId());

        if (!isCreator && !isAdmin && !isHodInSameDept) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "You do not have permission to delete this event"
            ));
        }

        // If synced with Google Calendar, remove remote event
        if (event.getGoogleEventId() != null) {
            googleCalendarService.deleteGoogleCalendarEvent(currentUserId, event.getGoogleEventId());
        }

        calendarEventRepository.delete(event);
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully", "id", id));
    }

    @GetMapping("/google/status")
    public ResponseEntity<Map<String, Object>> getGoogleCalendarStatus(Authentication authentication) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        boolean configured = googleCalendarService.isConfigured();
        boolean connected = currentUserId != null && googleCalendarService.isUserConnected(currentUserId);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("configured", configured);
        resp.put("clientIdAvailable", configured);
        resp.put("connected", connected);
        resp.put("provider", "Google Calendar API");
        resp.put("scope", "https://www.googleapis.com/auth/calendar.events");

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/google/connect-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> getGoogleConnectUrl(
            @RequestParam(required = false) String redirectUri,
            Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        Map<String, String> res = googleCalendarService.getConnectUrl(currentUserId, redirectUri);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/google/exchange")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> exchangeGoogleAuthCode(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        String code = body.get("code");
        String state = body.get("state");
        String redirectUri = body.get("redirectUri");

        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authorization code is required"));
        }
        if (state == null || state.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "OAuth state parameter is required"));
        }

        try {
            boolean success = googleCalendarService.exchangeAuthorizationCode(currentUserId, code, state, redirectUri);
            if (success) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "connected", true,
                        "message", "Google Calendar successfully connected"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                        "success", false,
                        "connected", false,
                        "message", "Failed to exchange authorization code with Google"
                ));
            }
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/google/disconnect")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> disconnectGoogleCalendar(Authentication authentication) {
        String currentUserId = authentication.getName();
        googleCalendarService.disconnect(currentUserId);
        return ResponseEntity.ok(Map.of(
                "connected", false,
                "message", "Google Calendar disconnected successfully"
        ));
    }
}
