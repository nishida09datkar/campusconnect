package com.campusconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_events")
public class CalendarEvent {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 256)
    private String title;

    @Column(length = 2048)
    private String description;

    @Column(name = "start_time", nullable = false, length = 64)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 64)
    private String endTime;

    @Column(nullable = false, length = 32)
    private String type = "MEETING";

    @Column(name = "creator_id", length = 64)
    private String creatorId;

    @Column(name = "department_id", length = 64)
    private String departmentId;

    @Column(name = "class_id", length = 64)
    private String classId;

    @Column(length = 256)
    private String location;

    @Column(length = 512)
    private String link;

    @Column(name = "meet_url", length = 512)
    private String meetUrl;

    @Column(name = "google_calendar_event_url", length = 1024)
    private String googleCalendarEventUrl;

    @Column(name = "google_event_id", length = 128)
    private String googleEventId;

    @Column(name = "participant_ids", length = 2048)
    private String participantIds;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public CalendarEvent() {}

    public CalendarEvent(String id, String title, String startTime, String endTime, String type, String creatorId) {
        this.id = id;
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.type = type;
        this.creatorId = creatorId;
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

    public String getGoogleEventId() { return googleEventId; }
    public void setGoogleEventId(String googleEventId) { this.googleEventId = googleEventId; }

    public String getParticipantIds() { return participantIds; }
    public void setParticipantIds(String participantIds) { this.participantIds = participantIds; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
