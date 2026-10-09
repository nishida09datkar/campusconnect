package com.campusconnect.dto.auth;

import com.campusconnect.entity.Role;

public class AuthResponse {
    private String token;
    private String userId;
    private String email;
    private String name;
    private Role role;
    private String departmentId;

    public AuthResponse() {}

    public AuthResponse(String token, String userId, String email, String name, Role role, String departmentId) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role;
        this.departmentId = departmentId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
}
