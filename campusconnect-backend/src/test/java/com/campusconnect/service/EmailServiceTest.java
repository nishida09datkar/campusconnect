package com.campusconnect.service;

import com.campusconnect.dto.notification.EmailSendResult;
import com.campusconnect.entity.NotificationPreference;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.NotificationPreferenceRepository;
import com.campusconnect.repository.UserRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private NotificationPreferenceRepository preferenceRepository;

    @Mock
    private UserRepository userRepository;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender, preferenceRepository, userRepository);
        ReflectionTestUtils.setField(emailService, "fromAddress", "noreply@campusconnect.edu");
        ReflectionTestUtils.setField(emailService, "mailEnabled", false); // Unconfigured by default in tests
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:3000");
    }

    @Test
    @DisplayName("Email is suppressed when recipient disables email notifications")
    void testSuppressedWhenMasterEmailDisabled() {
        User user = new User("u1", "user@campus.test", "hash", "User 1", Role.STUDENT, "dept-ce");
        NotificationPreference pref = new NotificationPreference("u1");
        pref.setEmailNotifications(false);

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(preferenceRepository.findById("u1")).thenReturn(Optional.of(pref));

        EmailSendResult result = emailService.sendNotificationEmail(
                "u1", "ASSIGNMENT", "New Assignment", "Assignment 1", "Due Friday", "http://localhost:3000"
        );

        assertEquals("SUPPRESSED", result.getStatus());
        assertTrue(result.getMessage().contains("disabled"));
    }

    @Test
    @DisplayName("Email is suppressed when specific category is disabled")
    void testSuppressedWhenCategoryAlertsDisabled() {
        User user = new User("u2", "user2@campus.test", "hash", "User 2", Role.STUDENT, "dept-ce");
        NotificationPreference pref = new NotificationPreference("u2");
        pref.setEmailNotifications(true);
        pref.setAssignmentAlerts(false); // Disabled assignments only

        when(userRepository.findById("u2")).thenReturn(Optional.of(user));
        when(preferenceRepository.findById("u2")).thenReturn(Optional.of(pref));

        EmailSendResult result = emailService.sendNotificationEmail(
                "u2", "ASSIGNMENT", "New Assignment", "Assignment 2", "Details", "http://localhost:3000"
        );

        assertEquals("SUPPRESSED", result.getStatus());
        assertTrue(result.getMessage().contains("assignment alerts"));
    }

    @Test
    @DisplayName("When mail is unconfigured, returns UNCONFIGURED status gracefully without throwing")
    void testUnconfiguredStateReturnsGracefully() {
        User user = new User("u3", "user3@campus.test", "hash", "User 3", Role.FACULTY, "dept-ce");
        NotificationPreference pref = new NotificationPreference("u3");
        pref.setEmailNotifications(true);
        pref.setMeetingAlerts(true);

        when(userRepository.findById("u3")).thenReturn(Optional.of(user));
        when(preferenceRepository.findById("u3")).thenReturn(Optional.of(pref));

        EmailSendResult result = emailService.sendNotificationEmail(
                "u3", "MEETING", "Faculty Council", "Meeting Scheduled", "Agenda", "http://localhost:3000/calendar"
        );

        assertEquals("UNCONFIGURED", result.getStatus());
        assertTrue(result.getMessage().contains("unconfigured"));
    }

    @Test
    @DisplayName("When recipient does not exist, returns SUPPRESSED with error description")
    void testNonExistentRecipient() {
        when(userRepository.findById("unknown-id")).thenReturn(Optional.empty());

        EmailSendResult result = emailService.sendNotificationEmail(
                "unknown-id", "MEETING", "Subject", "Title", "Details", "http://localhost:3000"
        );

        assertEquals("SUPPRESSED", result.getStatus());
        assertTrue(result.getMessage().contains("Recipient user does not exist"));
    }

    @Test
    @DisplayName("When mail is enabled and provider is configured, dispatches email successfully")
    void testSuccessfulEmailDispatch() {
        ReflectionTestUtils.setField(emailService, "mailEnabled", true);

        User user = new User("u4", "student4@campus.test", "hash", "Student 4", Role.STUDENT, "dept-ce");
        NotificationPreference pref = new NotificationPreference("u4");

        when(userRepository.findById("u4")).thenReturn(Optional.of(user));
        when(preferenceRepository.findById("u4")).thenReturn(Optional.of(pref));

        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        EmailSendResult result = emailService.sendNotificationEmail(
                "u4", "ASSIGNMENT", "Assignment Due", "Assignment 4", "Due Tomorrow", "http://localhost:3000/assignments"
        );

        assertEquals("SENT", result.getStatus());
        assertTrue(result.getMessage().contains("accepted by SMTP server"));
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Repeated test emails within cooldown are rate limited")
    void testTestEmailRateLimiting() {
        User user = new User("u5", "user5@campus.test", "hash", "User 5", Role.STUDENT, "dept-ce");
        NotificationPreference pref = new NotificationPreference("u5");

        when(userRepository.findById("u5")).thenReturn(Optional.of(user));
        when(preferenceRepository.findById("u5")).thenReturn(Optional.of(pref));

        // First call
        EmailSendResult first = emailService.sendTestEmail("u5");
        assertNotEquals("rate limit", first.getMessage().toLowerCase());

        // Immediate second call within 30 seconds
        EmailSendResult second = emailService.sendTestEmail("u5");
        assertEquals("SUPPRESSED", second.getStatus());
        assertTrue(second.getMessage().contains("rate limit active"));
    }
}
