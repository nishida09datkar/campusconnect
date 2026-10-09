package com.campusconnect.dto.analytics;

import java.util.List;
import java.util.Map;

public class AdminAnalyticsDto {
    private long totalDepartments;
    private long totalFaculty;
    private long totalStudents;
    private long activeClasses;
    private long callsThisWeek;
    private long messagesThisWeek;
    private List<ActivityPoint> weeklyActivity;
    private Map<String, Long> userDistribution;

    public AdminAnalyticsDto() {}

    public AdminAnalyticsDto(long totalDepartments, long totalFaculty, long totalStudents,
                             long activeClasses, long callsThisWeek, long messagesThisWeek,
                             List<ActivityPoint> weeklyActivity, Map<String, Long> userDistribution) {
        this.totalDepartments = totalDepartments;
        this.totalFaculty = totalFaculty;
        this.totalStudents = totalStudents;
        this.activeClasses = activeClasses;
        this.callsThisWeek = callsThisWeek;
        this.messagesThisWeek = messagesThisWeek;
        this.weeklyActivity = weeklyActivity;
        this.userDistribution = userDistribution;
    }

    public long getTotalDepartments() { return totalDepartments; }
    public void setTotalDepartments(long totalDepartments) { this.totalDepartments = totalDepartments; }

    public long getTotalFaculty() { return totalFaculty; }
    public void setTotalFaculty(long totalFaculty) { this.totalFaculty = totalFaculty; }

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }

    public long getActiveClasses() { return activeClasses; }
    public void setActiveClasses(long activeClasses) { this.activeClasses = activeClasses; }

    public long getCallsThisWeek() { return callsThisWeek; }
    public void setCallsThisWeek(long callsThisWeek) { this.callsThisWeek = callsThisWeek; }

    public long getMessagesThisWeek() { return messagesThisWeek; }
    public void setMessagesThisWeek(long messagesThisWeek) { this.messagesThisWeek = messagesThisWeek; }

    public List<ActivityPoint> getWeeklyActivity() { return weeklyActivity; }
    public void setWeeklyActivity(List<ActivityPoint> weeklyActivity) { this.weeklyActivity = weeklyActivity; }

    public Map<String, Long> getUserDistribution() { return userDistribution; }
    public void setUserDistribution(Map<String, Long> userDistribution) { this.userDistribution = userDistribution; }

    public static class ActivityPoint {
        private String day;
        private long messages;
        private long calls;

        public ActivityPoint() {}
        public ActivityPoint(String day, long messages, long calls) {
            this.day = day;
            this.messages = messages;
            this.calls = calls;
        }

        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }

        public long getMessages() { return messages; }
        public void setMessages(long messages) { this.messages = messages; }

        public long getCalls() { return calls; }
        public void setCalls(long calls) { this.calls = calls; }
    }
}
