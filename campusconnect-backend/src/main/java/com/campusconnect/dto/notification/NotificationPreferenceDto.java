package com.campusconnect.dto.notification;

import com.campusconnect.entity.NotificationPreference;

public class NotificationPreferenceDto {
    private String userId;
    private boolean emailNotifications = true;
    private boolean inAppNotifications = true;
    private boolean assignmentAlerts = true;
    private boolean announcementAlerts = true;
    private boolean meetingAlerts = true;
    private boolean chatAlerts = false;
    private boolean attendanceAlerts = true;
    private String digestFrequency = "IMMEDIATE";

    public NotificationPreferenceDto() {}

    public static NotificationPreferenceDto from(NotificationPreference pref) {
        NotificationPreferenceDto dto = new NotificationPreferenceDto();
        dto.setUserId(pref.getUserId());
        dto.setEmailNotifications(pref.isEmailNotifications());
        dto.setInAppNotifications(pref.isInAppNotifications());
        dto.setAssignmentAlerts(pref.isAssignmentAlerts());
        dto.setAnnouncementAlerts(pref.isAnnouncementAlerts());
        dto.setMeetingAlerts(pref.isMeetingAlerts());
        dto.setChatAlerts(pref.isChatAlerts());
        dto.setAttendanceAlerts(pref.isAttendanceAlerts());
        dto.setDigestFrequency(pref.getDigestFrequency());
        return dto;
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
}
