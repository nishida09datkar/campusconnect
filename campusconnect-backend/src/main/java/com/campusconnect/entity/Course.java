package com.campusconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 32)
    private String code;

    @Column(nullable = false, length = 128)
    private String title;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(nullable = false)
    private Integer year;

    public Course() {}

    public Course(String id, String code, String title, String departmentId, Integer year) {
        this.id = id;
        this.code = code;
        this.title = title;
        this.departmentId = departmentId;
        this.year = year;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
}
