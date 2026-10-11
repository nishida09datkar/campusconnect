package com.campusconnect.controller;

import com.campusconnect.dto.calendar.CalendarEventDto;
import com.campusconnect.entity.CalendarEvent;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.CalendarEventRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.EmailService;
import com.campusconnect.service.GoogleCalendarService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CalendarSecurityTest {

    @Mock
    private CalendarEventRepository calendarEventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private GoogleCalendarService googleCalendarService;

    @Mock
    private Authentication authentication;

    private CalendarController calendarController;

    @BeforeEach
    void setUp() {
        calendarController = new CalendarController(
                calendarEventRepository,
                userRepository,
                emailService,
                googleCalendarService
        );
    }

    @Test
    @DisplayName("Student attempting to schedule a LECTURE is rejected with 403 Forbidden")
    void studentCannotCreateLecture() {
        when(authentication.getName()).thenReturn("user-stu-1");
        User student = new User("user-stu-1", "student1@campus.test", "pass", "Aryan Sharma", Role.STUDENT, "dept-ce");
        when(userRepository.findById("user-stu-1")).thenReturn(Optional.of(student));

        CalendarEventDto dto = new CalendarEventDto();
        dto.setTitle("Unauthorized Lecture");
        dto.setType("LECTURE");
        dto.setStartTime("2026-10-15T10:00:00Z");
        dto.setEndTime("2026-10-15T11:00:00Z");

        ResponseEntity<?> response = calendarController.createEvent(dto, authentication);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(calendarEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Non-admin user attempting to create event for a different department is rejected with 403 Forbidden")
    void nonAdminCannotCreateEventInDifferentDepartment() {
        when(authentication.getName()).thenReturn("user-fac-neha");
        User facultyCe = new User("user-fac-neha", "neha@campus.test", "pass", "Prof. Neha Kulkarni", Role.FACULTY, "dept-ce");
        when(userRepository.findById("user-fac-neha")).thenReturn(Optional.of(facultyCe));

        CalendarEventDto dto = new CalendarEventDto();
        dto.setTitle("Cross-Department Event");
        dto.setType("MEETING");
        dto.setDepartmentId("dept-it");
        dto.setStartTime("2026-10-15T14:00:00Z");
        dto.setEndTime("2026-10-15T15:00:00Z");

        ResponseEntity<?> response = calendarController.createEvent(dto, authentication);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(calendarEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Unauthorized user cannot delete another person's event (403 Forbidden)")
    void unauthorizedUserCannotDeleteEvent() {
        when(authentication.getName()).thenReturn("user-stu-2");
        User student = new User("user-stu-2", "student2@campus.test", "pass", "Diya Patel", Role.STUDENT, "dept-ce");
        when(userRepository.findById("user-stu-2")).thenReturn(Optional.of(student));

        CalendarEvent event = new CalendarEvent(
                "evt-99",
                "Faculty Consultation",
                "2026-10-15T10:00:00Z",
                "2026-10-15T11:00:00Z",
                "MEETING",
                "user-fac-neha"
        );
        event.setDepartmentId("dept-ce");
        when(calendarEventRepository.findById("evt-99")).thenReturn(Optional.of(event));

        ResponseEntity<?> response = calendarController.deleteEvent("evt-99", authentication);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(calendarEventRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Event creator can successfully delete their own event")
    void eventCreatorCanDeleteEvent() {
        when(authentication.getName()).thenReturn("user-fac-neha");
        User faculty = new User("user-fac-neha", "neha@campus.test", "pass", "Prof. Neha Kulkarni", Role.FACULTY, "dept-ce");
        when(userRepository.findById("user-fac-neha")).thenReturn(Optional.of(faculty));

        CalendarEvent event = new CalendarEvent(
                "evt-100",
                "My Study Session",
                "2026-10-15T10:00:00Z",
                "2026-10-15T11:00:00Z",
                "MEETING",
                "user-fac-neha"
        );
        when(calendarEventRepository.findById("evt-100")).thenReturn(Optional.of(event));

        ResponseEntity<?> response = calendarController.deleteEvent("evt-100", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(calendarEventRepository).delete(event);
    }
}
