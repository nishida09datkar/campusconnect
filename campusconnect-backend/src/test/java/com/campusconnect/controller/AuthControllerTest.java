package com.campusconnect.controller;

import com.campusconnect.dto.auth.AuthResponse;
import com.campusconnect.dto.auth.LoginRequest;
import com.campusconnect.dto.user.UserDto;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.GlobalExceptionHandler;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtTokenProvider;
import com.campusconnect.service.AuthService;
import com.campusconnect.service.GoogleAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private GoogleAuthService googleAuthService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private Authentication authentication;

    private AuthController authController;
    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        authController = new AuthController(authService, googleAuthService, userRepository, tokenProvider);
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Login with valid credentials returns 200 OK and auth response")
    void loginSuccess() {
        LoginRequest req = new LoginRequest("admin@campus.test", "Admin@123");
        AuthResponse expected = new AuthResponse(
                "token-123",
                "user-admin",
                "admin@campus.test",
                "Aarav Mehta",
                Role.ADMIN,
                null
        );
        when(authService.login(req)).thenReturn(expected);

        ResponseEntity<AuthResponse> response = authController.login(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("user-admin", response.getBody().getUserId());
        assertEquals(Role.ADMIN, response.getBody().getRole());
    }

    @Test
    @DisplayName("Invalid credentials caught by GlobalExceptionHandler returns 401 Unauthorized")
    void loginInvalidCredentialsReturns401() {
        BadCredentialsException ex = new BadCredentialsException("Invalid email or password");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleBadCredentials(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(401, response.getBody().get("status"));
        assertEquals("Invalid email or password", response.getBody().get("message"));
    }

    @Test
    @DisplayName("Authenticated /api/auth/me returns current user details")
    void getCurrentUserSuccess() {
        when(authentication.getName()).thenReturn("user-fac-neha");
        User faculty = new User("user-fac-neha", "neha@campus.test", "pass", "Prof. Neha Kulkarni", Role.FACULTY, "dept-ce");
        when(userRepository.findById("user-fac-neha")).thenReturn(Optional.of(faculty));

        ResponseEntity<UserDto> response = authController.getCurrentUser(authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("user-fac-neha", response.getBody().getId());
        assertEquals("Prof. Neha Kulkarni", response.getBody().getName());
        assertEquals(Role.FACULTY, response.getBody().getRole());
    }

    @Test
    @DisplayName("Authenticated /api/auth/me returns 404 when user is not found in database")
    void getCurrentUserNotFound() {
        when(authentication.getName()).thenReturn("nonexistent");
        when(userRepository.findById("nonexistent")).thenReturn(Optional.empty());

        ResponseEntity<UserDto> response = authController.getCurrentUser(authentication);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("/api/auth/refresh returns new JWT token for active user")
    void refreshTokenSuccess() {
        when(authentication.getName()).thenReturn("user-stu-1");
        User student = new User("user-stu-1", "student1@campus.test", "pass", "Aryan Sharma", Role.STUDENT, "dept-ce");
        when(userRepository.findById("user-stu-1")).thenReturn(Optional.of(student));
        when(tokenProvider.generateToken("user-stu-1", "student1@campus.test", "STUDENT")).thenReturn("fresh-jwt-token");

        ResponseEntity<Map<String, String>> response = authController.refreshToken(authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("fresh-jwt-token", response.getBody().get("accessToken"));
    }

    @Test
    @DisplayName("/api/auth/refresh returns 401 when user is inactive or missing")
    void refreshTokenInactiveUser() {
        when(authentication.getName()).thenReturn("user-deactivated");
        User deactivated = new User("user-deactivated", "deact@campus.test", "pass", "Deactivated", Role.STUDENT, "dept-ce");
        deactivated.setActive(false);
        when(userRepository.findById("user-deactivated")).thenReturn(Optional.of(deactivated));

        ResponseEntity<Map<String, String>> response = authController.refreshToken(authentication);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("/api/auth/logout returns 200 OK")
    void logoutReturnsSuccess() {
        ResponseEntity<Map<String, String>> response = authController.logout();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("message"));
    }
}
