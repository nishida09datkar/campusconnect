package com.campusconnect.dto.calendar;

import com.campusconnect.entity.CalendarEvent;
import jakarta.validation.constraints.NotBlank;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class CalendarEventDto {

    private String id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Start time is required")
    private String startTime;

    @NotBlank(message = "End time is required")
    private String endTime;

    private String type = "MEETING";
    private String creatorId;
    private String creatorName;
    private String departmentId;
    private String classId;
    private String location;
    private String link;
    private String meetUrl;
    private String googleCalendarEventUrl;
    private String googleCalendarAddUrl;
    private String googleEventId;
    private Boolean requestGoogleMeet;
    private List<String> participantIds = new ArrayList<>();

    public CalendarEventDto() {}

    public static CalendarEventDto from(CalendarEvent entity) {
        if (entity == null) return null;
        CalendarEventDto dto = new CalendarEventDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setType(entity.getType());
        dto.setCreatorId(entity.getCreatorId());
        dto.setDepartmentId(entity.getDepartmentId());
        dto.setClassId(entity.getClassId());
        dto.setLocation(entity.getLocation());
        dto.setLink(entity.getLink());
        dto.setMeetUrl(entity.getMeetUrl());
        dto.setGoogleCalendarEventUrl(entity.getGoogleCalendarEventUrl());
        dto.setGoogleEventId(entity.getGoogleEventId());

        if (entity.getParticipantIds() != null && !entity.getParticipantIds().trim().isEmpty()) {
            dto.setParticipantIds(
                    Arrays.stream(entity.getParticipantIds().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList())
            );
        }

        dto.setGoogleCalendarAddUrl(buildGoogleCalendarAddUrl(entity));
        return dto;
    }

    public static String buildGoogleCalendarAddUrl(CalendarEvent entity) {
        try {
            String title = URLEncoder.encode(entity.getTitle() != null ? entity.getTitle() : "CampusConnect Event", StandardCharsets.UTF_8);
            String desc = entity.getDescription() != null ? entity.getDescription() : "";
            if (entity.getMeetUrl() != null && !entity.getMeetUrl().isEmpty()) {
                desc += "\n\nJoin Google Meet: " + entity.getMeetUrl();
            }
            String details = URLEncoder.encode(desc, StandardCharsets.UTF_8);
            String loc = URLEncoder.encode(entity.getLocation() != null ? entity.getLocation() : "CampusConnect", StandardCharsets.UTF_8);

            String startClean = entity.getStartTime().replaceAll("[-:]", "").split("\\.")[0];
            String endClean = entity.getEndTime().replaceAll("[-:]", "").split("\\.")[0];
            if (!startClean.endsWith("Z")) startClean += "Z";
            if (!endClean.endsWith("Z")) endClean += "Z";

            return "https://calendar.google.com/calendar/render?action=TEMPLATE&text="
                    + title + "&dates=" + startClean + "/" + endClean
                    + "&details=" + details + "&location=" + loc;
        } catch (Exception e) {
            return "https://calendar.google.com/calendar/u/0/r";
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getCreatorId() { return creatorId; }
    public void setCreatorId(String creatorId) { this.creatorId = creatorId; }

    public String getCreatorName() { return creatorName; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }

    public String getMeetUrl() { return meetUrl; }
    public void setMeetUrl(String meetUrl) { this.meetUrl = meetUrl; }

    public String getGoogleCalendarEventUrl() { return googleCalendarEventUrl; }
    public void setGoogleCalendarEventUrl(String googleCalendarEventUrl) { this.googleCalendarEventUrl = googleCalendarEventUrl; }

    public String getGoogleCalendarAddUrl() { return googleCalendarAddUrl; }
    public void setGoogleCalendarAddUrl(String googleCalendarAddUrl) { this.googleCalendarAddUrl = googleCalendarAddUrl; }

    public String getGoogleEventId() { return googleEventId; }
    public void setGoogleEventId(String googleEventId) { this.googleEventId = googleEventId; }

    public Boolean getRequestGoogleMeet() { return requestGoogleMeet; }
    public void setRequestGoogleMeet(Boolean requestGoogleMeet) { this.requestGoogleMeet = requestGoogleMeet; }

    public List<String> getParticipantIds() { return participantIds; }
    public void setParticipantIds(List<String> participantIds) { this.participantIds = participantIds; }
}
