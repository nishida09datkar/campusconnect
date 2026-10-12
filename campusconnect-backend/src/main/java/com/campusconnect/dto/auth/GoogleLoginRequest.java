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
}
