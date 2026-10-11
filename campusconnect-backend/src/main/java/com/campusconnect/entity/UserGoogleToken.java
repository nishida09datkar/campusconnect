package com.campusconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_google_tokens")
public class UserGoogleToken {

    @Id
    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "access_token", length = 2048, nullable = false)
    private String accessToken;

    @Column(name = "refresh_token", length = 1024)
    private String refreshToken;

    @Column(name = "expiry_epoch_ms")
    private long expiryEpochMs;

    @Column(length = 512)
    private String scope;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UserGoogleToken() {}

    public UserGoogleToken(String userId, String accessToken, String refreshToken, long expiryEpochMs, String scope) {
        this.userId = userId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiryEpochMs = expiryEpochMs;
        this.scope = scope;
        this.updatedAt = LocalDateTime.now();
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public long getExpiryEpochMs() { return expiryEpochMs; }
    public void setExpiryEpochMs(long expiryEpochMs) { this.expiryEpochMs = expiryEpochMs; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isExpired() {
        return System.currentTimeMillis() >= (expiryEpochMs - 60_000); // 1 minute safety buffer
    }
}
