package com.campusconnect.dto.academic;

public class AllocationResponse {
    private String id;
    private String facultyId;
    private String courseId;
    private String facultyName;
    private String facultyEmail;
    private String facultyDesignation;
    private String courseCode;
    private String courseTitle;
    private Integer courseYear;

    public AllocationResponse() {}

    public AllocationResponse(String id, String facultyId, String courseId, String facultyName, String facultyEmail, String facultyDesignation, String courseCode, String courseTitle, Integer courseYear) {
        this.id = id;
        this.facultyId = facultyId;
        this.courseId = courseId;
        this.facultyName = facultyName;
        this.facultyEmail = facultyEmail;
        this.facultyDesignation = facultyDesignation;
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.courseYear = courseYear;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getFacultyEmail() { return facultyEmail; }
    public void setFacultyEmail(String facultyEmail) { this.facultyEmail = facultyEmail; }

    public String getFacultyDesignation() { return facultyDesignation; }
    public void setFacultyDesignation(String facultyDesignation) { this.facultyDesignation = facultyDesignation; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public Integer getCourseYear() { return courseYear; }
    public void setCourseYear(Integer courseYear) { this.courseYear = courseYear; }
}
