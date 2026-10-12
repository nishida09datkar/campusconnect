package com.campusconnect.dto.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Sent by the frontend after Google Identity Services returns a signed
 * ID token for the user who just completed the Google Sign-In popup.
 * The backend verifies this token's signature with Google directly —
 * it never trusts the email the frontend claims on its own.
 */
public class GoogleLoginRequest {

    @NotBlank(message = "Google ID token is required")
    private String idToken;

    private String role;
    private String departmentId;

    public GoogleLoginRequest() {}

    public GoogleLoginRequest(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }
}
