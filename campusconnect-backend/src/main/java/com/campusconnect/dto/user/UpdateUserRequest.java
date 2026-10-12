package com.campusconnect.dto.user;

import com.campusconnect.entity.Role;

public class UpdateUserRequest {

    private String name;
    private String email;
    private Role role;
    private String departmentId;
    private String password;
    private Boolean active;
    private String rollNo;
    private Integer year;
    private String division;
    private String employeeId;
    private String designation;
    private String avatarUrl;

    public UpdateUserRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public String getRollNo() { return rollNo; }
    public void setRollNo(String rollNo) { this.rollNo = rollNo; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
