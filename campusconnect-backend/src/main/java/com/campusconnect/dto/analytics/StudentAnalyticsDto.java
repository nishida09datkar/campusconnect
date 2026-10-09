package com.campusconnect.dto.analytics;

import java.util.List;

public class StudentAnalyticsDto {
    private String studentId;
    private double overallAttendancePercentage;
    private int presentSessions;
    private int totalSessions;
    private List<GradePoint> gradesOverTime;
    private List<SubmissionHistoryItem> submissionHistory;

    public StudentAnalyticsDto() {}

    public StudentAnalyticsDto(String studentId, double overallAttendancePercentage, int presentSessions,
                               int totalSessions, List<GradePoint> gradesOverTime, List<SubmissionHistoryItem> submissionHistory) {
        this.studentId = studentId;
        this.overallAttendancePercentage = overallAttendancePercentage;
        this.presentSessions = presentSessions;
        this.totalSessions = totalSessions;
        this.gradesOverTime = gradesOverTime;
        this.submissionHistory = submissionHistory;
    }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public double getOverallAttendancePercentage() { return overallAttendancePercentage; }
    public void setOverallAttendancePercentage(double overallAttendancePercentage) { this.overallAttendancePercentage = overallAttendancePercentage; }

    public int getPresentSessions() { return presentSessions; }
    public void setPresentSessions(int presentSessions) { this.presentSessions = presentSessions; }

    public int getTotalSessions() { return totalSessions; }
    public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }

    public List<GradePoint> getGradesOverTime() { return gradesOverTime; }
    public void setGradesOverTime(List<GradePoint> gradesOverTime) { this.gradesOverTime = gradesOverTime; }

    public List<SubmissionHistoryItem> getSubmissionHistory() { return submissionHistory; }
    public void setSubmissionHistory(List<SubmissionHistoryItem> submissionHistory) { this.submissionHistory = submissionHistory; }

    public static class GradePoint {
        private String assessmentTitle;
        private int marks;
        private int maxMarks;
        private double percentage;
        private String date;

        public GradePoint() {}
        public GradePoint(String assessmentTitle, int marks, int maxMarks, double percentage, String date) {
            this.assessmentTitle = assessmentTitle;
            this.marks = marks;
            this.maxMarks = maxMarks;
            this.percentage = percentage;
            this.date = date;
        }

        public String getAssessmentTitle() { return assessmentTitle; }
        public void setAssessmentTitle(String assessmentTitle) { this.assessmentTitle = assessmentTitle; }

        public int getMarks() { return marks; }
        public void setMarks(int marks) { this.marks = marks; }

        public int getMaxMarks() { return maxMarks; }
        public void setMaxMarks(int maxMarks) { this.maxMarks = maxMarks; }

        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
    }

    public static class SubmissionHistoryItem {
        private String assignmentTitle;
        private String className;
        private String submittedAt;
        private String status;
        private boolean onTime;

        public SubmissionHistoryItem() {}
        public SubmissionHistoryItem(String assignmentTitle, String className, String submittedAt, String status, boolean onTime) {
            this.assignmentTitle = assignmentTitle;
            this.className = className;
            this.submittedAt = submittedAt;
            this.status = status;
            this.onTime = onTime;
        }

        public String getAssignmentTitle() { return assignmentTitle; }
        public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }

        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }

        public String getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public boolean isOnTime() { return onTime; }
        public void setOnTime(boolean onTime) { this.onTime = onTime; }
    }
}
