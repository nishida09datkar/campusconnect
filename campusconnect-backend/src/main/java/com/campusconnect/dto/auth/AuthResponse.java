package com.campusconnect.dto.auth;

import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;

public class AuthResponse {
    private String token;
    private String accessToken;
    private String userId;
    private String email;
    private String name;
    private Role role;
    private String departmentId;
    private User user;

    public AuthResponse() {}

    public AuthResponse(String token, String userId, String email, String name, Role role, String departmentId, User user) {
        this.token = token;
        this.accessToken = token;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role;
        this.departmentId = departmentId;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) {
        this.token = token;
        this.accessToken = token;
    }

    public String getAccessToken() { return accessToken != null ? accessToken : token; }
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
        this.token = accessToken;
    }

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

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
