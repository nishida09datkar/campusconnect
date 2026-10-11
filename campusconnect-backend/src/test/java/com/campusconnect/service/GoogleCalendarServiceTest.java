package com.campusconnect.service;

import com.campusconnect.entity.CalendarEvent;
import com.campusconnect.entity.UserGoogleToken;
import com.campusconnect.repository.UserGoogleTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GoogleCalendarServiceTest {

    private static final String CLIENT_ID = "12345-calendar.apps.googleusercontent.com";
    private static final String CLIENT_SECRET = "secret-xyz";

    @Mock
    private UserGoogleTokenRepository tokenRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    private GoogleCalendarService calendarService;

    @BeforeEach
    void setUp() {
        when(restTemplateBuilder.setConnectTimeout(any())).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.setReadTimeout(any())).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.build()).thenReturn(restTemplate);

        calendarService = new GoogleCalendarService(tokenRepository, restTemplateBuilder);
        ReflectionTestUtils.setField(calendarService, "configuredClientId", CLIENT_ID);
        ReflectionTestUtils.setField(calendarService, "configuredClientSecret", CLIENT_SECRET);
        ReflectionTestUtils.setField(calendarService, "frontendUrl", "http://localhost:3000");
    }

    @Test
    @DisplayName("Unconfigured client credentials report unconfigured status")
    void testUnconfiguredReportsGracefully() {
        ReflectionTestUtils.setField(calendarService, "configuredClientId", "");
        assertFalse(calendarService.isConfigured());

        Map<String, String> res = calendarService.getConnectUrl("u1", "http://localhost:3000/calendar");
        assertEquals("unconfigured", res.get("status"));
        assertTrue(res.get("message").contains("not configured"));
    }

    @Test
    @DisplayName("Configured state generates valid authorization URL and state token")
    void testConfiguredConnectUrlGeneratesState() {
        Map<String, String> res = calendarService.getConnectUrl("u1", "http://localhost:3000/calendar");
        assertEquals("configured", res.get("status"));
        assertNotNull(res.get("url"));
        assertTrue(res.get("url").contains("accounts.google.com"));
        assertTrue(res.get("url").contains("state="));

        String state = res.get("state");
        assertNotNull(state);

        // Validate state belongs to u1 and cannot be reused by another user
        assertFalse(calendarService.validateAndConsumeOAuthState(state, "other-user"));
        assertTrue(calendarService.validateAndConsumeOAuthState(state, "u1"));
        // Consumed state cannot be reused
        assertFalse(calendarService.validateAndConsumeOAuthState(state, "u1"));
    }

    @Test
    @DisplayName("Valid token creates Google Calendar event and extracts genuine Google Meet URL")
    void testCreateGoogleCalendarEventWithMeet() {
        String userId = "u1";
        UserGoogleToken token = new UserGoogleToken(
                userId,
                "valid-access-token",
                "refresh-token",
                System.currentTimeMillis() + 3600_000,
                "https://www.googleapis.com/auth/calendar.events"
        );
        when(tokenRepository.findById(userId)).thenReturn(Optional.of(token));

        Map<String, Object> fakeResponse = new HashMap<>();
        fakeResponse.put("id", "gcal-evt-12345");
        fakeResponse.put("htmlLink", "https://www.google.com/calendar/event?eid=abc123xyz");

        Map<String, Object> entryPoint = new HashMap<>();
        entryPoint.put("entryPointType", "video");
        entryPoint.put("uri", "https://meet.google.com/xyz-abcd-uvw");

        Map<String, Object> confData = new HashMap<>();
        confData.put("entryPoints", List.of(entryPoint));
        fakeResponse.put("conferenceData", confData);

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(fakeResponse));

        CalendarEvent event = new CalendarEvent(
                "evt-1", "Department Faculty Board", "2026-10-15T10:00:00Z", "2026-10-15T11:00:00Z", "MEETING", userId
        );

        boolean created = calendarService.createGoogleCalendarEvent(userId, event, true);

        assertTrue(created);
        assertEquals("gcal-evt-12345", event.getGoogleEventId());
        assertEquals("https://www.google.com/calendar/event?eid=abc123xyz", event.getGoogleCalendarEventUrl());
        assertEquals("https://meet.google.com/xyz-abcd-uvw", event.getMeetUrl());
    }

    @Test
    @DisplayName("Unconnected user does not fail or fabricate Meet URLs")
    void testUnconnectedUserDoesNotFabricateMeetUrl() {
        String userId = "u-unconnected";
        when(tokenRepository.findById(userId)).thenReturn(Optional.empty());

        CalendarEvent event = new CalendarEvent(
                "evt-2", "Local Meeting", "2026-10-15T10:00:00Z", "2026-10-15T11:00:00Z", "MEETING", userId
        );

        boolean created = calendarService.createGoogleCalendarEvent(userId, event, true);

        assertFalse(created);
        assertNull(event.getGoogleEventId());
        assertNull(event.getGoogleCalendarEventUrl());
        assertNull(event.getMeetUrl());
    }
}
