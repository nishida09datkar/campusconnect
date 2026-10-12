package com.campusconnect.dto.academic;

public class DepartmentResponse {
    private String id;
    private String name;
    private String code;
    private String hodId;
    private String hodName;
    private String hodEmail;
    private int facultyCount;
    private int studentCount;
    private int courseCount;

    public DepartmentResponse() {}

    public DepartmentResponse(String id, String name, String code, String hodId, String hodName, String hodEmail, int facultyCount, int studentCount, int courseCount) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.hodId = hodId;
        this.hodName = hodName;
        this.hodEmail = hodEmail;
        this.facultyCount = facultyCount;
        this.studentCount = studentCount;
        this.courseCount = courseCount;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getHodId() { return hodId; }
    public void setHodId(String hodId) { this.hodId = hodId; }

    public String getHodName() { return hodName; }
    public void setHodName(String hodName) { this.hodName = hodName; }

    public String getHodEmail() { return hodEmail; }
    public void setHodEmail(String hodEmail) { this.hodEmail = hodEmail; }

    public int getFacultyCount() { return facultyCount; }
    public void setFacultyCount(int facultyCount) { this.facultyCount = facultyCount; }

    public int getStudentCount() { return studentCount; }
    public void setStudentCount(int studentCount) { this.studentCount = studentCount; }

    public int getCourseCount() { return courseCount; }
    public void setCourseCount(int courseCount) { this.courseCount = courseCount; }
}
