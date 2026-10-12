package com.campusconnect.dto.academic;

import com.campusconnect.entity.User;
import java.util.List;

public class ClassMembersResponse {
    private User faculty;
    private List<User> students;

    public ClassMembersResponse() {}

    public ClassMembersResponse(User faculty, List<User> students) {
        this.faculty = faculty;
        this.students = students;
    }

    public User getFaculty() { return faculty; }
    public void setFaculty(User faculty) { this.faculty = faculty; }

    public List<User> getStudents() { return students; }
    public void setStudents(List<User> students) { this.students = students; }
}
