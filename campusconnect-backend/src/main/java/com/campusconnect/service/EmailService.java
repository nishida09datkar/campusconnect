package com.campusconnect.service;

import com.campusconnect.dto.notification.EmailSendResult;
import com.campusconnect.entity.NotificationPreference;
import com.campusconnect.entity.User;
import com.campusconnect.repository.NotificationPreferenceRepository;
import com.campusconnect.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final int MAX_CACHE_SIZE = 500;
    private static final long DEBOUNCE_WINDOW_MS = 180_000; // 3 minutes
    private static final long TEST_EMAIL_COOLDOWN_MS = 30_000; // 30 seconds

    private final JavaMailSender mailSender;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    @Value("${campusconnect.mail.from:noreply@campusconnect.edu}")
    private String fromAddress;

    @Value("${campusconnect.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${campusconnect.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    // Bounded duplicate send cache: recipient:eventType:fingerprint -> epochMs
    private final Map<String, Long> duplicateSendCache = new ConcurrentHashMap<>();

    // Rate-limit cache for test email endpoint: userId -> epochMs
    private final Map<String, Long> testEmailRateLimitCache = new ConcurrentHashMap<>();

    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            NotificationPreferenceRepository preferenceRepository,
            UserRepository userRepository
    ) {
        this.mailSender = mailSender;
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    public EmailSendResult sendTestEmail(String userId) {
        long now = System.currentTimeMillis();
        Long lastTestTime = testEmailRateLimitCache.get(userId);
        if (lastTestTime != null && (now - lastTestTime) < TEST_EMAIL_COOLDOWN_MS) {
            long remainingSeconds = (TEST_EMAIL_COOLDOWN_MS - (now - lastTestTime)) / 1000;
            return EmailSendResult.suppressed(
                    userId,
                    "Test email rate limit active. Please wait " + remainingSeconds + "s before requesting another test email.",
                    "TEST"
            );
        }
        testEmailRateLimitCache.put(userId, now);

        return sendNotificationEmail(
                userId,
                "SYSTEM",
                "Email Notification System Test",
                "CampusConnect Email Verification Test",
                "This email confirms that your CampusConnect notification delivery and SMTP integration are functioning correctly. Your email preferences are active.",
                frontendUrl + "/profile"
        );
    }

    public EmailSendResult sendNotificationEmail(
            String recipientUserId,
            String eventType,
            String subject,
            String title,
            String details,
            String rawActionUrl
    ) {
        User recipient = userRepository.findById(recipientUserId).orElse(null);
        if (recipient == null) {
            return EmailSendResult.suppressed("unknown", "Recipient user does not exist", eventType);
        }

        String recipientEmail = recipient.getEmail();
        if (recipientEmail == null || !recipientEmail.contains("@")) {
            return EmailSendResult.suppressed("invalid", "User has invalid email address", eventType);
        }

        // 1. Check user preferences
        NotificationPreference preference = preferenceRepository.findById(recipientUserId)
                .orElseGet(() -> new NotificationPreference(recipientUserId));

        if (!preference.isEmailNotifications()) {
            log.info("Email suppressed for {}: master email notifications disabled", recipientEmail);
            return EmailSendResult.suppressed(recipientEmail, "User disabled all email notifications", eventType);
        }

        if ("ASSIGNMENT".equalsIgnoreCase(eventType) && !preference.isAssignmentAlerts()) {
            log.info("Email suppressed for {}: assignment alerts disabled", recipientEmail);
            return EmailSendResult.suppressed(recipientEmail, "User disabled assignment alerts", eventType);
        }

        if (("ANNOUNCEMENT".equalsIgnoreCase(eventType) || "NOTICE".equalsIgnoreCase(eventType)) && !preference.isAnnouncementAlerts()) {
            log.info("Email suppressed for {}: announcement alerts disabled", recipientEmail);
            return EmailSendResult.suppressed(recipientEmail, "User disabled announcement alerts", eventType);
        }

        if (("MEETING".equalsIgnoreCase(eventType) || "CALENDAR".equalsIgnoreCase(eventType)) && !preference.isMeetingAlerts()) {
            log.info("Email suppressed for {}: meeting alerts disabled", recipientEmail);
            return EmailSendResult.suppressed(recipientEmail, "User disabled meeting alerts", eventType);
        }

        if ("CHAT".equalsIgnoreCase(eventType) && !preference.isChatAlerts()) {
            return EmailSendResult.suppressed(recipientEmail, "User disabled chat email alerts", eventType);
        }

        if ("ATTENDANCE".equalsIgnoreCase(eventType) && !preference.isAttendanceAlerts()) {
            return EmailSendResult.suppressed(recipientEmail, "User disabled attendance alerts", eventType);
        }

        // 2. Prevent duplicate sends within debounce window (bounded cache)
        pruneDuplicateCacheIfFull();
        String dedupeKey = recipientUserId + ":" + eventType + ":" + title;
        long now = System.currentTimeMillis();
        Long lastSent = duplicateSendCache.get(dedupeKey);
        if (lastSent != null && (now - lastSent) < DEBOUNCE_WINDOW_MS) {
            log.info("Duplicate notification suppressed within 3m window for {}", dedupeKey);
            return EmailSendResult.suppressed(recipientEmail, "Duplicate event within debounce window", eventType);
        }

        // 3. Check if mail delivery is enabled/configured
        if (!mailEnabled || mailSender == null) {
            log.info("Email would be sent to {} for event [{}] - Provider unconfigured or CAMPUSCONNECT_MAIL_ENABLED=false",
                    recipientEmail, eventType);
            return EmailSendResult.unconfigured(
                    recipientEmail,
                    "Email provider is unconfigured. Set CAMPUSCONNECT_MAIL_ENABLED=true and SMTP environment variables to deliver real emails.",
                    eventType
            );
        }

        // 4. Sanitize action URL and construct professional branded HTML email
        String actionUrl = sanitizeActionUrl(rawActionUrl);
        String htmlBody = buildHtmlEmail(recipient.getName(), title, details, actionUrl);
        String plainText = buildPlainTextEmail(recipient.getName(), title, details, actionUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipientEmail);
            helper.setSubject("[CampusConnect] " + subject);
            helper.setText(plainText, htmlBody);

            mailSender.send(message);
            duplicateSendCache.put(dedupeKey, now);

            log.info("Email successfully dispatched to {} for event [{}]", recipientEmail, eventType);
            EmailSendResult sentResult = EmailSendResult.sent(recipientEmail, eventType);
            sentResult.setMessage("Notification email accepted by SMTP server for delivery to " + recipientEmail + " (delivery subject to mail network MTA)");
            return sentResult;
        } catch (Exception ex) {
            log.error("Failed to deliver email to {}: {}", recipientEmail, ex.getMessage());
            return EmailSendResult.failed(recipientEmail, ex.getMessage(), eventType);
        }
    }

    private synchronized void pruneDuplicateCacheIfFull() {
        if (duplicateSendCache.size() > MAX_CACHE_SIZE) {
            long threshold = System.currentTimeMillis() - DEBOUNCE_WINDOW_MS;
            duplicateSendCache.entrySet().removeIf(entry -> entry.getValue() < threshold);
        }
    }

    private String sanitizeActionUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.trim().isEmpty()) return "";
        String trimmed = rawUrl.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        if (trimmed.startsWith("/")) {
            return frontendUrl + trimmed;
        }
        return "";
    }

    private String buildHtmlEmail(String recipientName, String title, String details, String actionUrl) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head><meta charset='UTF-8'><style>"
                + "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }"
                + ".container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }"
                + ".header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; color: #ffffff; }"
                + ".header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }"
                + ".header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }"
                + ".content { padding: 32px 24px; }"
                + ".title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }"
                + ".details-box { background: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #334155; }"
                + ".button-wrap { text-align: center; margin: 28px 0 16px; }"
                + ".btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 600; border-radius: 8px; }"
                + ".footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }"
                + "</style></head>"
                + "<body>"
                + "<div class='container'>"
                + "  <div class='header'>"
                + "    <h1>CampusConnect</h1>"
                + "    <p>Official University Academic Platform</p>"
                + "  </div>"
                + "  <div class='content'>"
                + "    <p>Hello <strong>" + escape(recipientName) + "</strong>,</p>"
                + "    <div class='title'>" + escape(title) + "</div>"
                + "    <div class='details-box'>" + escape(details) + "</div>"
                + (actionUrl != null && !actionUrl.trim().isEmpty()
                ? "    <div class='button-wrap'><a href='" + escape(actionUrl) + "' class='btn'>View in CampusConnect</a></div>"
                : "")
                + "  </div>"
                + "  <div class='footer'>"
                + "    <p>This is an automated notification from your university campus system.</p>"
                + "    <p>To update your email preferences, visit your CampusConnect Profile settings.</p>"
                + "  </div>"
                + "</div>"
                + "</body></html>";
    }

    private String buildPlainTextEmail(String recipientName, String title, String details, String actionUrl) {
        StringBuilder sb = new StringBuilder();
        sb.append("CampusConnect - University Academic Platform\n\n");
        sb.append("Hello ").append(recipientName).append(",\n\n");
        sb.append(title).append("\n\n");
        sb.append(details).append("\n\n");
        if (actionUrl != null && !actionUrl.trim().isEmpty()) {
            sb.append("Link: ").append(actionUrl).append("\n\n");
        }
        sb.append("---\nCampusConnect System Notifications\n");
        return sb.toString();
    }

    private String escape(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
