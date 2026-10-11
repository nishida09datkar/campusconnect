package com.campusconnect.service;

import com.campusconnect.entity.CalendarEvent;
import com.campusconnect.entity.UserGoogleToken;
import com.campusconnect.repository.UserGoogleTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GoogleCalendarService {

    private static final Logger log = LoggerFactory.getLogger(GoogleCalendarService.class);
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    private static final String CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

    private final UserGoogleTokenRepository tokenRepository;
    private final RestTemplate restTemplate;

    @Value("${campusconnect.google.client-id:}")
    private String configuredClientId;

    @Value("${campusconnect.google.client-secret:}")
    private String configuredClientSecret;

    @Value("${campusconnect.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    // CSRF OAuth State Cache: state -> { userId, timestamp }
    private final Map<String, OAuthStateEntry> oauthStateCache = new ConcurrentHashMap<>();

    private static class OAuthStateEntry {
        final String userId;
        final long createdAt;

        OAuthStateEntry(String userId) {
            this.userId = userId;
            this.createdAt = System.currentTimeMillis();
        }
    }

    public GoogleCalendarService(
            UserGoogleTokenRepository tokenRepository,
            RestTemplateBuilder restTemplateBuilder
    ) {
        this.tokenRepository = tokenRepository;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(6))
                .setReadTimeout(Duration.ofSeconds(6))
                .build();
    }

    public boolean isConfigured() {
        if (configuredClientId == null || configuredClientId.trim().isEmpty()) return false;
        String lower = configuredClientId.toLowerCase();
        return !lower.contains("dummy") && !lower.contains("placeholder") && !lower.contains("your-google-client-id");
    }

    public boolean isUserConnected(String userId) {
        return tokenRepository.findById(userId)
                .map(token -> token.getRefreshToken() != null || !token.isExpired())
                .orElse(false);
    }

    public String generateOAuthState(String userId) {
        pruneExpiredStates();
        String state = UUID.randomUUID().toString();
        oauthStateCache.put(state, new OAuthStateEntry(userId));
        return state;
    }

    public boolean validateAndConsumeOAuthState(String state, String expectedUserId) {
        pruneExpiredStates();
        if (state == null || state.trim().isEmpty()) return false;
        OAuthStateEntry entry = oauthStateCache.get(state);
        if (entry == null) return false;
        if (!entry.userId.equals(expectedUserId)) {
            return false;
        }
        oauthStateCache.remove(state);
        return true;
    }

    private void pruneExpiredStates() {
        long now = System.currentTimeMillis();
        oauthStateCache.entrySet().removeIf(entry -> (now - entry.getValue().createdAt) > 900_000); // 15 mins
    }

    private boolean isAllowedRedirectUri(String redirectUri) {
        if (redirectUri == null || redirectUri.trim().isEmpty()) return false;
        String lower = redirectUri.trim().toLowerCase();
        return lower.startsWith("http://localhost:3000")
                || lower.startsWith("http://localhost:3001")
                || lower.startsWith("http://127.0.0.1:3000")
                || lower.startsWith("http://127.0.0.1:3001")
                || (frontendUrl != null && !frontendUrl.isEmpty() && lower.startsWith(frontendUrl.toLowerCase()));
    }

    public Map<String, String> getConnectUrl(String userId, String requestedRedirectUri) {
        if (!isConfigured()) {
            return Map.of(
                    "status", "unconfigured",
                    "url", "",
                    "message", "Google Client ID / Secret are not configured in backend environment."
            );
        }

        String state = generateOAuthState(userId);
        String redirectUri = (requestedRedirectUri != null && isAllowedRedirectUri(requestedRedirectUri))
                ? requestedRedirectUri.trim()
                : (frontendUrl + "/calendar");

        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + URLEncoder.encode(configuredClientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&response_type=code"
                + "&scope=" + URLEncoder.encode(CALENDAR_SCOPE, StandardCharsets.UTF_8)
                + "&access_type=offline"
                + "&prompt=consent"
                + "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8);

        return Map.of(
                "status", "configured",
                "url", authUrl,
                "state", state
        );
    }

    public boolean exchangeAuthorizationCode(String userId, String code, String state, String redirectUri) {
        if (!validateAndConsumeOAuthState(state, userId)) {
            log.warn("OAuth authorization code exchange rejected: invalid or expired CSRF state for user {}", userId);
            throw new IllegalArgumentException("Invalid or expired OAuth state parameter (CSRF protection)");
        }

        if (!isConfigured()) {
            throw new IllegalStateException("Google OAuth credentials are not configured on the server");
        }

        String validRedirectUri = (redirectUri != null && isAllowedRedirectUri(redirectUri))
                ? redirectUri.trim()
                : (frontendUrl + "/calendar");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", configuredClientId);
        body.add("client_secret", configuredClientSecret);
        body.add("redirect_uri", validRedirectUri);
        body.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.postForEntity(GOOGLE_TOKEN_URL, request, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.error("Google token exchange failed with HTTP status {}", response.getStatusCode());
                return false;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> tokenData = response.getBody();
            String accessToken = (String) tokenData.get("access_token");
            String refreshToken = (String) tokenData.get("refresh_token");
            Number expiresIn = (Number) tokenData.get("expires_in");
            String scope = (String) tokenData.get("scope");

            long expiryMs = System.currentTimeMillis() + (expiresIn != null ? expiresIn.longValue() * 1000 : 3600_000);

            UserGoogleToken tokenEntity = tokenRepository.findById(userId)
                    .orElse(new UserGoogleToken(userId, accessToken, refreshToken, expiryMs, scope));

            tokenEntity.setAccessToken(accessToken);
            if (refreshToken != null && !refreshToken.trim().isEmpty()) {
                tokenEntity.setRefreshToken(refreshToken);
            }
            tokenEntity.setExpiryEpochMs(expiryMs);
            tokenEntity.setScope(scope);
            tokenEntity.setUpdatedAt(LocalDateTime.now());

            tokenRepository.save(tokenEntity);
            log.info("Successfully exchanged Google OAuth token for user {}", userId);
            return true;
        } catch (Exception e) {
            log.error("Google token exchange error for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    public synchronized String getValidAccessToken(String userId) {
        Optional<UserGoogleToken> opt = tokenRepository.findById(userId);
        if (opt.isEmpty()) return null;

        UserGoogleToken token = opt.get();
        if (!token.isExpired()) {
            return token.getAccessToken();
        }

        if (token.getRefreshToken() == null || token.getRefreshToken().trim().isEmpty()) {
            log.warn("Google token expired for user {} and no refresh token available", userId);
            return null;
        }

        // Refresh token
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("refresh_token", token.getRefreshToken());
        body.add("client_id", configuredClientId);
        body.add("client_secret", configuredClientSecret);
        body.add("grant_type", "refresh_token");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.postForEntity(GOOGLE_TOKEN_URL, request, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.error("Failed to refresh Google token for user {}: HTTP {}", userId, response.getStatusCode());
                return null;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> tokenData = response.getBody();
            String newAccessToken = (String) tokenData.get("access_token");
            Number expiresIn = (Number) tokenData.get("expires_in");
            long expiryMs = System.currentTimeMillis() + (expiresIn != null ? expiresIn.longValue() * 1000 : 3600_000);

            token.setAccessToken(newAccessToken);
            token.setExpiryEpochMs(expiryMs);
            token.setUpdatedAt(LocalDateTime.now());
            tokenRepository.save(token);

            log.info("Refreshed Google OAuth token for user {}", userId);
            return newAccessToken;
        } catch (Exception e) {
            log.error("Token refresh exception for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    public boolean createGoogleCalendarEvent(String userId, CalendarEvent event, boolean requestGoogleMeet) {
        String accessToken = getValidAccessToken(userId);
        if (accessToken == null) {
            log.info("Skipping Google Calendar event creation for user {}: not connected or token unavailable", userId);
            return false;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("summary", event.getTitle());
        if (event.getDescription() != null && !event.getDescription().trim().isEmpty()) {
            payload.put("description", event.getDescription());
        }
        if (event.getLocation() != null && !event.getLocation().trim().isEmpty()) {
            payload.put("location", event.getLocation());
        }

        Map<String, String> startMap = Map.of("dateTime", formatIso(event.getStartTime()));
        Map<String, String> endMap = Map.of("dateTime", formatIso(event.getEndTime()));
        payload.put("start", startMap);
        payload.put("end", endMap);

        if (requestGoogleMeet) {
            Map<String, Object> confRequest = new LinkedHashMap<>();
            confRequest.put("requestId", "cc-meet-" + UUID.randomUUID().toString());
            confRequest.put("conferenceSolutionKey", Map.of("type", "hangoutsMeet"));
            payload.put("conferenceData", Map.of("createRequest", confRequest));
        }

        String url = GOOGLE_CALENDAR_EVENTS_URL + (requestGoogleMeet ? "?conferenceDataVersion=1" : "");
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Google Calendar API returned status {} when creating event", response.getStatusCode());
                return false;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> resBody = response.getBody();
            String googleEventId = (String) resBody.get("id");
            String htmlLink = (String) resBody.get("htmlLink");

            if (googleEventId != null) {
                event.setGoogleEventId(googleEventId);
            }
            if (htmlLink != null) {
                event.setGoogleCalendarEventUrl(htmlLink);
            }

            // Extract Google Meet link from conferenceData if present
            if (resBody.containsKey("conferenceData")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> confData = (Map<String, Object>) resBody.get("conferenceData");
                if (confData != null && confData.containsKey("entryPoints")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> entryPoints = (List<Map<String, Object>>) confData.get("entryPoints");
                    if (entryPoints != null) {
                        for (Map<String, Object> ep : entryPoints) {
                            if ("video".equalsIgnoreCase((String) ep.get("entryPointType"))) {
                                String uri = (String) ep.get("uri");
                                if (uri != null && uri.startsWith("https://meet.google.com/")) {
                                    event.setMeetUrl(uri);
                                    log.info("Attached genuine Google Meet URL to event {}: {}", event.getId(), uri);
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            log.info("Created real Google Calendar event for event ID {}: link={}", event.getId(), htmlLink);
            return true;
        } catch (Exception ex) {
            log.error("Failed to create Google Calendar event for user {}: {}", userId, ex.getMessage());
            return false;
        }
    }

    public void deleteGoogleCalendarEvent(String userId, String googleEventId) {
        if (googleEventId == null || googleEventId.trim().isEmpty()) return;
        String accessToken = getValidAccessToken(userId);
        if (accessToken == null) return;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            String url = GOOGLE_CALENDAR_EVENTS_URL + "/" + URLEncoder.encode(googleEventId, StandardCharsets.UTF_8);
            restTemplate.exchange(url, HttpMethod.DELETE, request, Void.class);
            log.info("Deleted Google Calendar event {} for user {}", googleEventId, userId);
        } catch (Exception ex) {
            log.warn("Could not delete Google Calendar event {}: {}", googleEventId, ex.getMessage());
        }
    }

    public void disconnect(String userId) {
        tokenRepository.deleteById(userId);
        log.info("Disconnected Google Calendar for user {}", userId);
    }

    private String formatIso(String iso) {
        if (iso == null) return null;
        String trimmed = iso.trim();
        if (!trimmed.endsWith("Z") && !trimmed.contains("+") && !trimmed.matches(".*-\\d{2}:\\d{2}$")) {
            trimmed += "Z";
        }
        return trimmed;
    }
}
