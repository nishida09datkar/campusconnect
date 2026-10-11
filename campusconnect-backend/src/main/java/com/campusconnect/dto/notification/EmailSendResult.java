package com.campusconnect.dto.notification;

public class EmailSendResult {
    private String status; // SENT, SUPPRESSED, UNCONFIGURED, FAILED
    private String recipient;
    private String message;
    private String eventType;
    private long timestamp = System.currentTimeMillis();

    public EmailSendResult() {}

    public EmailSendResult(String status, String recipient, String message, String eventType) {
        this.status = status;
        this.recipient = recipient;
        this.message = message;
        this.eventType = eventType;
    }

    public static EmailSendResult sent(String recipient, String eventType) {
        return new EmailSendResult("SENT", recipient, "Email accepted by SMTP provider for delivery", eventType);
    }

    public static EmailSendResult suppressed(String recipient, String reason, String eventType) {
        return new EmailSendResult("SUPPRESSED", recipient, reason, eventType);
    }

    public static EmailSendResult unconfigured(String recipient, String reason, String eventType) {
        return new EmailSendResult("UNCONFIGURED", recipient, reason, eventType);
    }

    public static EmailSendResult failed(String recipient, String error, String eventType) {
        return new EmailSendResult("FAILED", recipient, "SMTP provider failure: " + error, eventType);
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
