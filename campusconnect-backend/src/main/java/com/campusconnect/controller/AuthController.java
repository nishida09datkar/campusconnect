package com.campusconnect.controller;

import com.campusconnect.dto.auth.AuthResponse;
import com.campusconnect.dto.auth.GoogleAuthRequest;
import com.campusconnect.dto.auth.LoginRequest;
import com.campusconnect.dto.user.UserDto;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtTokenProvider;
import com.campusconnect.service.AuthService;
import com.campusconnect.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"})
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    public AuthController(
            AuthService authService,
            GoogleAuthService googleAuthService,
            UserRepository userRepository,
            JwtTokenProvider tokenProvider
    ) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(googleAuthService.authenticateWithGoogle(request.getIdToken()));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        String userId = authentication.getName();
        return userRepository.findById(userId)
                .map(UserDto::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/refresh")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> refreshToken(Authentication authentication) {
        String userId = authentication.getName();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.isActive()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String newToken = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(Map.of("accessToken", newToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
