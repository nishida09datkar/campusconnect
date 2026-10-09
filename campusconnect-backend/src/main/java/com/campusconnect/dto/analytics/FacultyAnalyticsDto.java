package com.campusconnect.dto.analytics;

import java.util.List;

public class FacultyAnalyticsDto {
    private String facultyId;
    private List<ClassGradingProgress> gradingProgress;
    private List<ClassAttendanceRecord> attendanceHistory;

    public FacultyAnalyticsDto() {}

    public FacultyAnalyticsDto(String facultyId, List<ClassGradingProgress> gradingProgress, List<ClassAttendanceRecord> attendanceHistory) {
        this.facultyId = facultyId;
        this.gradingProgress = gradingProgress;
        this.attendanceHistory = attendanceHistory;
    }

    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }

    public List<ClassGradingProgress> getGradingProgress() { return gradingProgress; }
    public void setGradingProgress(List<ClassGradingProgress> gradingProgress) { this.gradingProgress = gradingProgress; }

    public List<ClassAttendanceRecord> getAttendanceHistory() { return attendanceHistory; }
    public void setAttendanceHistory(List<ClassAttendanceRecord> attendanceHistory) { this.attendanceHistory = attendanceHistory; }

    public static class ClassGradingProgress {
        private String classId;
        private String className;
        private int gradedSubmissions;
        private int pendingSubmissions;
        private int totalSubmissions;

        public ClassGradingProgress() {}
        public ClassGradingProgress(String classId, String className, int gradedSubmissions, int pendingSubmissions, int totalSubmissions) {
            this.classId = classId;
            this.className = className;
            this.gradedSubmissions = gradedSubmissions;
            this.pendingSubmissions = pendingSubmissions;
            this.totalSubmissions = totalSubmissions;
        }

        public String getClassId() { return classId; }
        public void setClassId(String classId) { this.classId = classId; }

        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }

        public int getGradedSubmissions() { return gradedSubmissions; }
        public void setGradedSubmissions(int gradedSubmissions) { this.gradedSubmissions = gradedSubmissions; }

        public int getPendingSubmissions() { return pendingSubmissions; }
        public void setPendingSubmissions(int pendingSubmissions) { this.pendingSubmissions = pendingSubmissions; }

        public int getTotalSubmissions() { return totalSubmissions; }
        public void setTotalSubmissions(int totalSubmissions) { this.totalSubmissions = totalSubmissions; }
    }

    public static class ClassAttendanceRecord {
        private String classId;
        private String className;
        private double averageAttendance;
        private int totalSessions;

        public ClassAttendanceRecord() {}
        public ClassAttendanceRecord(String classId, String className, double averageAttendance, int totalSessions) {
            this.classId = classId;
            this.className = className;
            this.averageAttendance = averageAttendance;
            this.totalSessions = totalSessions;
        }

        public String getClassId() { return classId; }
        public void setClassId(String classId) { this.classId = classId; }

        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }

        public double getAverageAttendance() { return averageAttendance; }
        public void setAverageAttendance(double averageAttendance) { this.averageAttendance = averageAttendance; }

        public int getTotalSessions() { return totalSessions; }
        public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }
    }
}
