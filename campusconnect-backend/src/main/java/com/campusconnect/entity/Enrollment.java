package com.campusconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "enrollments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "class_id"})
)
public class Enrollment {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "class_id", nullable = false, length = 64)
    private String classId;

    public Enrollment() {}

    public Enrollment(String id, String studentId, String classId) {
        this.id = id;
        this.studentId = studentId;
        this.classId = classId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
}
