package com.campusconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "email_notifications", nullable = false)
    private boolean emailNotifications = true;

    @Column(name = "in_app_notifications", nullable = false)
    private boolean inAppNotifications = true;

    @Column(name = "assignment_alerts", nullable = false)
    private boolean assignmentAlerts = true;

    @Column(name = "announcement_alerts", nullable = false)
    private boolean announcementAlerts = true;

    @Column(name = "meeting_alerts", nullable = false)
    private boolean meetingAlerts = true;

    @Column(name = "chat_alerts", nullable = false)
    private boolean chatAlerts = false;

    @Column(name = "attendance_alerts", nullable = false)
    private boolean attendanceAlerts = true;

    @Column(name = "digest_frequency", length = 32, nullable = false)
    private String digestFrequency = "IMMEDIATE";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public NotificationPreference() {}

    public NotificationPreference(String userId) {
        this.userId = userId;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public boolean isEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }

    public boolean isInAppNotifications() { return inAppNotifications; }
    public void setInAppNotifications(boolean inAppNotifications) { this.inAppNotifications = inAppNotifications; }

    public boolean isAssignmentAlerts() { return assignmentAlerts; }
    public void setAssignmentAlerts(boolean assignmentAlerts) { this.assignmentAlerts = assignmentAlerts; }

    public boolean isAnnouncementAlerts() { return announcementAlerts; }
    public void setAnnouncementAlerts(boolean announcementAlerts) { this.announcementAlerts = announcementAlerts; }

    public boolean isMeetingAlerts() { return meetingAlerts; }
    public void setMeetingAlerts(boolean meetingAlerts) { this.meetingAlerts = meetingAlerts; }

    public boolean isChatAlerts() { return chatAlerts; }
    public void setChatAlerts(boolean chatAlerts) { this.chatAlerts = chatAlerts; }

    public boolean isAttendanceAlerts() { return attendanceAlerts; }
    public void setAttendanceAlerts(boolean attendanceAlerts) { this.attendanceAlerts = attendanceAlerts; }

    public String getDigestFrequency() { return digestFrequency; }
    public void setDigestFrequency(String digestFrequency) { this.digestFrequency = digestFrequency; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
