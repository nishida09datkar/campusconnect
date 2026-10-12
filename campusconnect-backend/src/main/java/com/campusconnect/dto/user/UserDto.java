package com.campusconnect.dto.user;

import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class UserDto {
    private String id;
    private String email;
    private String name;
    private Role role;
    private String departmentId;
    private String avatar;
    private Integer year;
    private Integer semester;
    private String rollNo;
    private String division;
    private String employeeId;
    private String designation;
    private boolean active;
    private LocalDateTime createdAt;
    private String temporaryPassword;

    public UserDto() {}

    public UserDto(String id, String email, String name, Role role, String departmentId,
                   String avatar, Integer year, Integer semester, String rollNo, String division,
                   String employeeId, String designation, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
        this.departmentId = departmentId;
        this.avatar = avatar;
        this.year = year;
        this.semester = semester;
        this.rollNo = rollNo;
        this.division = division;
        this.employeeId = employeeId;
        this.designation = designation;
        this.active = active;
        this.createdAt = createdAt;
    }

    public static UserDto from(User user) {
        if (user == null) return null;
        UserDto dto = new UserDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getDepartmentId(),
                user.getAvatar(),
                user.getYear(),
                user.getSemester(),
                user.getRollNo(),
                user.getDivision(),
                user.getEmployeeId(),
                user.getDesignation(),
                user.isActive(),
                user.getCreatedAt()
        );
        dto.setRollNo(user.getRollNo());
        dto.setDivision(user.getDivision());
        dto.setEmployeeId(user.getEmployeeId());
        dto.setDesignation(user.getDesignation());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    @JsonProperty("avatarUrl")
    public String getAvatarUrl() { return avatar; }
    public void setAvatarUrl(String avatarUrl) { this.avatar = avatarUrl; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getRollNo() { return rollNo; }
    public void setRollNo(String rollNo) { this.rollNo = rollNo; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    @JsonProperty("isActive")
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    @JsonProperty("isActive")
    public boolean getIsActive() { return active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getTemporaryPassword() { return temporaryPassword; }
    public void setTemporaryPassword(String temporaryPassword) { this.temporaryPassword = temporaryPassword; }
}
