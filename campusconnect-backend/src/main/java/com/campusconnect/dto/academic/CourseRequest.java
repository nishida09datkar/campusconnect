package com.campusconnect.dto.academic;

public class CourseRequest {
    private String code;
    private String title;
    private String departmentId;
    private Integer year;

    public CourseRequest() {}

    public CourseRequest(String code, String title, String departmentId, Integer year) {
        this.code = code;
        this.title = title;
        this.departmentId = departmentId;
        this.year = year;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
}
