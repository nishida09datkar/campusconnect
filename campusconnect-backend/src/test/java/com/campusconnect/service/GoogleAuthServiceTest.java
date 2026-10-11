package com.campusconnect.service;

import com.campusconnect.dto.auth.AuthResponse;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GoogleAuthServiceTest {

    private static final String TEST_CLIENT_ID = "123456789-test.apps.googleusercontent.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    private GoogleAuthService googleAuthService;

    @BeforeEach
    void setUp() {
        when(restTemplateBuilder.setConnectTimeout(any())).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.setReadTimeout(any())).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.build()).thenReturn(restTemplate);

        googleAuthService = new GoogleAuthService(
                userRepository,
                passwordEncoder,
                tokenProvider,
                restTemplateBuilder
        );
        ReflectionTestUtils.setField(googleAuthService, "configuredClientId", TEST_CLIENT_ID);
    }

    private Map<String, Object> createValidPayload(String email) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("iss", "https://accounts.google.com");
        payload.put("aud", TEST_CLIENT_ID);
        payload.put("sub", "google-sub-" + email.hashCode());
        payload.put("exp", (System.currentTimeMillis() / 1000) + 3600);
        payload.put("email", email);
        payload.put("email_verified", true);
        payload.put("name", "Test User");
        payload.put("picture", "https://google.com/avatar.jpg");
        return payload;
    }

    @Test
    @DisplayName("Blank ID token is rejected immediately")
    void testBlankTokenThrowsException() {
        assertThrows(BadCredentialsException.class, () -> googleAuthService.authenticateWithGoogle("   "));
        assertThrows(BadCredentialsException.class, () -> googleAuthService.authenticateWithGoogle(null));
    }

    @Test
    @DisplayName("Unconfigured client ID on server rejects authentication")
    void testUnconfiguredClientIdThrowsException() {
        ReflectionTestUtils.setField(googleAuthService, "configuredClientId", "");
        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> googleAuthService.authenticateWithGoogle("valid-id-token"));
        assertTrue(ex.getMessage().contains("not configured"));
    }

    @Test
    @DisplayName("Placeholder client ID on server rejects authentication")
    void testPlaceholderClientIdThrowsException() {
        ReflectionTestUtils.setField(googleAuthService, "configuredClientId", "your-google-client-id-dummy.apps.googleusercontent.com");
        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> googleAuthService.authenticateWithGoogle("valid-id-token"));
        assertTrue(ex.getMessage().contains("not configured"));
    }

    @Test
    @DisplayName("Audience mismatch is rejected")
    void testAudienceMismatchThrowsException() {
        Map<String, Object> payload = createValidPayload("student@test.com");
        payload.put("aud", "wrong-audience-client-id");

        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(payload));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> googleAuthService.authenticateWithGoogle("token"));
        assertTrue(ex.getMessage().contains("audience mismatch"));
    }

    @Test
    @DisplayName("Expired token is rejected")
    void testExpiredTokenThrowsException() {
        Map<String, Object> payload = createValidPayload("student@test.com");
        payload.put("exp", (System.currentTimeMillis() / 1000) - 300); // 5 minutes ago

        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(payload));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> googleAuthService.authenticateWithGoogle("token"));
        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    @DisplayName("Missing subject claim is rejected")
    void testMissingSubjectThrowsException() {
        Map<String, Object> payload = createValidPayload("student@test.com");
        payload.remove("sub");

        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(payload));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> googleAuthService.authenticateWithGoogle("token"));
        assertTrue(ex.getMessage().contains("subject claim"));
    }

    @Test
    @DisplayName("Unverified Google email is rejected")
    void testUnverifiedEmailThrowsException() {
        Map<String, Object> payload = createValidPayload("attacker@test.com");
        payload.put("email_verified", false);

        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(payload));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> googleAuthService.authenticateWithGoogle("token"));
        assertTrue(ex.getMessage().contains("not verified"));
    }

    @Test
    @DisplayName("Untrusted issuer is rejected")
    void testUntrustedIssuerThrowsException() {
        Map<String, Object> payload = createValidPayload("student@test.com");
        payload.put("iss", "https://evil-oauth.example.com");

        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(payload));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> googleAuthService.authenticateWithGoogle("token"));
        assertTrue(ex.getMessage().contains("Untrusted token issuer"));
    }

    @Test
    @DisplayName("Inactive user account is rejected")
    void testInactiveUserThrowsException() {
        Map<String, Object> payload = createValidPayload("inactive@campus.edu");

        User inactiveUser = new User("user-inactive", "inactive@campus.edu", "hash", "Inactive User", Role.STUDENT, "dept-ce");
        inactiveUser.setActive(false);

        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(payload));
        when(userRepository.findByEmail("inactive@campus.edu")).thenReturn(Optional.of(inactiveUser));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> googleAuthService.authenticateWithGoogle("token"));
        assertTrue(ex.getMessage().contains("inactive"));
    }

    @Test
    @DisplayName("New user is safely provisioned as STUDENT")
    void testNewUserSafelyProvisionedAsStudent() {
        Map<String, Object> payload = createValidPayload("newstudent@campus.edu");

        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(payload));
        when(userRepository.findByEmail("newstudent@campus.edu")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$encodedRandomSecret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokenProvider.generateToken(anyString(), eq("newstudent@campus.edu"), eq("STUDENT")))
                .thenReturn("mock-jwt-token-xyz");

        AuthResponse res = googleAuthService.authenticateWithGoogle("valid-token");

        assertNotNull(res);
        assertEquals("newstudent@campus.edu", res.getEmail());
        assertEquals(Role.STUDENT, res.getRole(), "New users must default to STUDENT");
        assertEquals("mock-jwt-token-xyz", res.getToken());
    }

    @Test
    @DisplayName("Existing faculty user retains FACULTY role (no privilege escalation or demotion)")
    void testExistingUserRetainsRole() {
        Map<String, Object> payload = createValidPayload("faculty@campus.test");
        payload.put("iss", "accounts.google.com");

        User existingFaculty = new User("fac-1", "faculty@campus.test", "hash", "Prof. Neha", Role.FACULTY, "dept-ce");

        when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(payload));
        when(userRepository.findByEmail("faculty@campus.test")).thenReturn(Optional.of(existingFaculty));
        when(userRepository.save(existingFaculty)).thenReturn(existingFaculty);
        when(tokenProvider.generateToken("fac-1", "faculty@campus.test", "FACULTY"))
                .thenReturn("faculty-jwt-token");

        AuthResponse res = googleAuthService.authenticateWithGoogle("valid-token");

        assertNotNull(res);
        assertEquals(Role.FACULTY, res.getRole());
        assertEquals("faculty-jwt-token", res.getToken());
    }
}
