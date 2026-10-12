package com.campusconnect.dto.academic;

public class AllocationRequest {
    private String facultyId;
    private String courseId;

    public AllocationRequest() {}

    public AllocationRequest(String facultyId, String courseId) {
        this.facultyId = facultyId;
        this.courseId = courseId;
    }

    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
}
