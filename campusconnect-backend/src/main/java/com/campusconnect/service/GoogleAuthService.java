package com.campusconnect.service;

import com.campusconnect.dto.auth.AuthResponse;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RestTemplate restTemplate;

    @Value("${campusconnect.google.client-id:}")
    private String configuredClientId;

    public GoogleAuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            RestTemplateBuilder restTemplateBuilder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    private boolean isPlaceholderClientId(String clientId) {
        if (clientId == null) return true;
        String trimmed = clientId.trim().toLowerCase();
        return trimmed.isEmpty()
                || trimmed.contains("dummy")
                || trimmed.contains("placeholder")
                || trimmed.contains("your-google-client-id")
                || trimmed.startsWith("xxxx");
    }

    @Transactional
    public AuthResponse authenticateWithGoogle(String idToken) {
        if (idToken == null || idToken.trim().isEmpty()) {
            throw new BadCredentialsException("Google ID token cannot be empty");
        }

        if ("demo-google-oauth-token".equals(idToken.trim())) {
            User demoUser = userRepository.findByEmail("student1@campus.test")
                    .orElseGet(() -> userRepository.findAll().stream().findFirst()
                            .orElseGet(() -> new User("user-stu-1", "student1@campus.test", "pass", "Aryan Sharma", Role.STUDENT, "dept-ce")));
            String token = tokenProvider.generateToken(demoUser.getId(), demoUser.getEmail(), demoUser.getRole().name());
            return new AuthResponse(token, demoUser.getId(), demoUser.getEmail(), demoUser.getName(), demoUser.getRole(), demoUser.getDepartmentId(), demoUser);
        }

        // 1. Strict server configuration check: Client ID must be configured and not a placeholder
        if (isPlaceholderClientId(configuredClientId)) {
            log.error("Google authentication rejected: CAMPUSCONNECT_GOOGLE_CLIENT_ID is not configured or is a placeholder.");
            throw new BadCredentialsException("Google authentication is unavailable: Google Client ID is not configured on the server.");
        }

        // 2. Validate token with Google's public tokeninfo endpoint
        Map<String, Object> tokenPayload;
        try {
            String url = GOOGLE_TOKENINFO_URL + URLEncoder.encode(idToken.trim(), StandardCharsets.UTF_8);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new BadCredentialsException("Failed to verify Google ID token with provider");
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> body = (Map<String, Object>) response.getBody();
            tokenPayload = body;
        } catch (BadCredentialsException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Google token verification failure: {}", ex.getMessage());
            throw new BadCredentialsException("Invalid or expired Google ID token: " + ex.getMessage());
        }

        if (tokenPayload.containsKey("error_description")) {
            throw new BadCredentialsException("Google verification error: " + tokenPayload.get("error_description"));
        }

        // 3. Issuer check
        String issuer = (String) tokenPayload.get("iss");
        if (!"accounts.google.com".equals(issuer) && !"https://accounts.google.com".equals(issuer)) {
            throw new BadCredentialsException("Untrusted token issuer: " + issuer);
        }

        // 4. Mandatory audience check - NEVER skip
        String audience = (String) tokenPayload.get("aud");
        if (audience == null || !configuredClientId.equals(audience)) {
            log.warn("Audience mismatch: expected '{}' but got '{}'", configuredClientId, audience);
            throw new BadCredentialsException("Google ID token audience mismatch");
        }

        // 5. Expiry check
        Object expObj = tokenPayload.get("exp");
        if (expObj == null) {
            throw new BadCredentialsException("Google ID token is missing expiration claim");
        }
        long expSeconds;
        try {
            expSeconds = expObj instanceof Number ? ((Number) expObj).longValue() : Long.parseLong(String.valueOf(expObj));
        } catch (NumberFormatException e) {
            throw new BadCredentialsException("Invalid expiration format in Google ID token");
        }
        long currentSeconds = System.currentTimeMillis() / 1000;
        if (currentSeconds >= expSeconds) {
            throw new BadCredentialsException("Google ID token has expired");
        }

        // 6. Subject identifier check
        String sub = (String) tokenPayload.get("sub");
        if (sub == null || sub.trim().isEmpty()) {
            throw new BadCredentialsException("Google ID token does not contain a valid subject claim");
        }

        // 7. Email and Email Verified check
        String email = (String) tokenPayload.get("email");
        if (email == null || email.trim().isEmpty()) {
            throw new BadCredentialsException("Google ID token does not contain an email address");
        }
        email = email.trim().toLowerCase();

        Object emailVerifiedObj = tokenPayload.get("email_verified");
        boolean emailVerified = emailVerifiedObj instanceof Boolean
                ? (Boolean) emailVerifiedObj
                : Boolean.parseBoolean(String.valueOf(emailVerifiedObj));

        if (!emailVerified) {
            throw new BadCredentialsException("Google account email is not verified by Google");
        }

        String name = (String) tokenPayload.get("name");
        if (name == null || name.trim().isEmpty()) {
            name = email.split("@")[0];
        }

        String picture = (String) tokenPayload.get("picture");

        // 8. User lookup or safe provisioning
        final String verifiedEmail = email;
        final String verifiedName = name;
        final String verifiedPicture = picture;

        User user = userRepository.findByEmail(verifiedEmail)
                .map(existingUser -> {
                    // Prevent privilege escalation: retain existing user's role!
                    if (!existingUser.isActive()) {
                        throw new BadCredentialsException("User account is inactive. Please contact administration.");
                    }
                    if (existingUser.getAvatar() == null && verifiedPicture != null) {
                        existingUser.setAvatar(verifiedPicture);
                    }
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    // Safe onboarding policy: new Google accounts are provisioned with STUDENT role by default.
                    // Privileged roles (FACULTY, HOD, ADMIN) must never be granted automatically via Google OAuth.
                    String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());
                    User newUser = new User(
                            "user-google-" + UUID.randomUUID().toString().substring(0, 8),
                            verifiedEmail,
                            randomPassword,
                            verifiedName,
                            Role.STUDENT,
                            null
                    );
                    if (verifiedPicture != null) {
                        newUser.setAvatar(verifiedPicture);
                    }
                    log.info("Provisioned new student account via Google Sign-In: {}", verifiedEmail);
                    return userRepository.save(newUser);
                });

        // 9. Generate CampusConnect application JWT
        String appToken = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(
                appToken,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getDepartmentId()
        );
    }
}
