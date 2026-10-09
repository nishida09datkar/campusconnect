package com.campusconnect.dto.analytics;

import java.util.List;

public class HodAnalyticsDto {
    private String departmentId;
    private String departmentName;
    private double submissionRate;
    private List<FacultyWorkload> facultyWorkload;
    private List<AttendanceTrend> attendanceTrend;

    public HodAnalyticsDto() {}

    public HodAnalyticsDto(String departmentId, String departmentName, double submissionRate,
                           List<FacultyWorkload> facultyWorkload, List<AttendanceTrend> attendanceTrend) {
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.submissionRate = submissionRate;
        this.facultyWorkload = facultyWorkload;
        this.attendanceTrend = attendanceTrend;
    }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public double getSubmissionRate() { return submissionRate; }
    public void setSubmissionRate(double submissionRate) { this.submissionRate = submissionRate; }

    public List<FacultyWorkload> getFacultyWorkload() { return facultyWorkload; }
    public void setFacultyWorkload(List<FacultyWorkload> facultyWorkload) { this.facultyWorkload = facultyWorkload; }

    public List<AttendanceTrend> getAttendanceTrend() { return attendanceTrend; }
    public void setAttendanceTrend(List<AttendanceTrend> attendanceTrend) { this.attendanceTrend = attendanceTrend; }

    public static class FacultyWorkload {
        private String facultyId;
        private String facultyName;
        private int classesCount;
        private int studentCount;

        public FacultyWorkload() {}
        public FacultyWorkload(String facultyId, String facultyName, int classesCount, int studentCount) {
            this.facultyId = facultyId;
            this.facultyName = facultyName;
            this.classesCount = classesCount;
            this.studentCount = studentCount;
        }

        public String getFacultyId() { return facultyId; }
        public void setFacultyId(String facultyId) { this.facultyId = facultyId; }

        public String getFacultyName() { return facultyName; }
        public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

        public int getClassesCount() { return classesCount; }
        public void setClassesCount(int classesCount) { this.classesCount = classesCount; }

        public int getStudentCount() { return studentCount; }
        public void setStudentCount(int studentCount) { this.studentCount = studentCount; }
    }

    public static class AttendanceTrend {
        private String dateOrWeek;
        private double attendancePercentage;

        public AttendanceTrend() {}
        public AttendanceTrend(String dateOrWeek, double attendancePercentage) {
            this.dateOrWeek = dateOrWeek;
            this.attendancePercentage = attendancePercentage;
        }

        public String getDateOrWeek() { return dateOrWeek; }
        public void setDateOrWeek(String dateOrWeek) { this.dateOrWeek = dateOrWeek; }

        public double getAttendancePercentage() { return attendancePercentage; }
        public void setAttendancePercentage(double attendancePercentage) { this.attendancePercentage = attendancePercentage; }
    }
}
