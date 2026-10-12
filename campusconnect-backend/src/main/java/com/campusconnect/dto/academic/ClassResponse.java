package com.campusconnect.dto.academic;

import com.campusconnect.entity.User;
import java.util.List;

public class ClassResponse {
    private String id;
    private String courseId;
    private String title;
    private String section;
    private String classCode;
    private String facultyId;
    private List<String> studentIds;
    private String coverColor;
    private int studentsCount;
    private CourseResponse course;
    private User faculty;

    public ClassResponse() {}

    public ClassResponse(String id, String courseId, String title, String section, String classCode, String facultyId, List<String> studentIds, String coverColor, int studentsCount, CourseResponse course, User faculty) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.section = section;
        this.classCode = classCode;
        this.facultyId = facultyId;
        this.studentIds = studentIds;
        this.coverColor = coverColor;
        this.studentsCount = studentsCount;
        this.course = course;
        this.faculty = faculty;
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

    public List<String> getStudentIds() { return studentIds; }
    public void setStudentIds(List<String> studentIds) { this.studentIds = studentIds; }

    public String getCoverColor() { return coverColor; }
    public void setCoverColor(String coverColor) { this.coverColor = coverColor; }

    public int getStudentsCount() { return studentsCount; }
    public void setStudentsCount(int studentsCount) { this.studentsCount = studentsCount; }

    public CourseResponse getCourse() { return course; }
    public void setCourse(CourseResponse course) { this.course = course; }

    public User getFaculty() { return faculty; }
    public void setFaculty(User faculty) { this.faculty = faculty; }
}
