package com.campusconnect.dto.academic;

public class CreateClassRequest {
    private String courseId;
    private String title;
    private String section;
    private String classCode;
    private String coverColor;

    public CreateClassRequest() {}

    public CreateClassRequest(String courseId, String title, String section, String classCode, String coverColor) {
        this.courseId = courseId;
        this.title = title;
        this.section = section;
        this.classCode = classCode;
        this.coverColor = coverColor;
    }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }

    public String getCoverColor() { return coverColor; }
    public void setCoverColor(String coverColor) { this.coverColor = coverColor; }
}
