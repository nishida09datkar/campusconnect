package com.campusconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "classrooms")
public class ClassRoom {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    @Column(nullable = false, length = 128)
    private String title;

    @Column(nullable = false, length = 32)
    private String section;

    @Column(name = "class_code", nullable = false, unique = true, length = 32)
    private String classCode;

    @Column(name = "faculty_id", nullable = false, length = 64)
    private String facultyId;

    @Column(name = "cover_color", length = 64)
    private String coverColor = "from-indigo-600 to-purple-600";

    public ClassRoom() {}

    public ClassRoom(String id, String courseId, String title, String section, String classCode, String facultyId, String coverColor) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.section = section;
        this.classCode = classCode;
        this.facultyId = facultyId;
        this.coverColor = coverColor != null ? coverColor : "from-indigo-600 to-purple-600";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }

    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }

    public String getCoverColor() { return coverColor; }
    public void setCoverColor(String coverColor) { this.coverColor = coverColor; }
}
