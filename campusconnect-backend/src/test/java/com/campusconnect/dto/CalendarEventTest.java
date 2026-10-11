package com.campusconnect.dto;

import com.campusconnect.dto.calendar.CalendarEventDto;
import com.campusconnect.entity.CalendarEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class CalendarEventTest {

    @Test
    @DisplayName("Google Calendar Add URL is properly formatted with date and parameters")
    void testGoogleCalendarAddUrlGeneration() {
        CalendarEvent event = new CalendarEvent(
                "evt-100",
                "Machine Learning Lab",
                "2026-10-14T11:00:00Z",
                "2026-10-14T12:00:00Z",
                "LECTURE",
                "user-fac-1"
        );
        event.setDescription("Deep Neural Networks Overview");
        event.setLocation("Lab 3");
        event.setMeetUrl("https://meet.google.com/abc-defg-hij");

        CalendarEventDto dto = CalendarEventDto.from(event);

        assertNotNull(dto);
        assertNotNull(dto.getGoogleCalendarAddUrl());
        assertTrue(dto.getGoogleCalendarAddUrl().contains("calendar.google.com/calendar/render?action=TEMPLATE"));
        assertTrue(dto.getGoogleCalendarAddUrl().contains("Machine+Learning+Lab") || dto.getGoogleCalendarAddUrl().contains("Machine%20Learning%20Lab"));
        assertTrue(dto.getGoogleCalendarAddUrl().contains("20261014T110000Z/20261014T120000Z"));
        assertTrue(dto.getGoogleCalendarAddUrl().contains("meet.google.com"));
    }
}
