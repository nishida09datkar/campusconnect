package com.campusconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_logs", indexes = {
    @Index(name = "idx_call_caller", columnList = "caller_id"),
    @Index(name = "idx_call_callee", columnList = "callee_id"),
    @Index(name = "idx_call_started", columnList = "started_at")
})
public class CallLog {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "caller_id", nullable = false, length = 64)
    private String callerId;

    @Column(name = "callee_id", length = 64)
    private String calleeId;

    @Column(name = "room_id", length = 128)
    private String roomId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CallKind kind;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "duration_sec")
    private Integer durationSec = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CallOutcome outcome;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public CallLog() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCallerId() { return callerId; }
    public void setCallerId(String callerId) { this.callerId = callerId; }

    public String getCalleeId() { return calleeId; }
    public void setCalleeId(String calleeId) { this.calleeId = calleeId; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public CallKind getKind() { return kind; }
    public void setKind(CallKind kind) { this.kind = kind; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }

    public Integer getDurationSec() { return durationSec; }
    public void setDurationSec(Integer durationSec) { this.durationSec = durationSec; }

    public CallOutcome getOutcome() { return outcome; }
    public void setOutcome(CallOutcome outcome) { this.outcome = outcome; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
