package com.campusconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "faculty_allocations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"faculty_id", "course_id"})
)
public class FacultyAllocation {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "faculty_id", nullable = false, length = 64)
    private String facultyId;

    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    public FacultyAllocation() {}

    public FacultyAllocation(String id, String facultyId, String courseId) {
        this.id = id;
        this.facultyId = facultyId;
        this.courseId = courseId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
}
