package com.campusconnect.dto.call;

import com.campusconnect.entity.CallKind;
import com.campusconnect.entity.CallOutcome;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CallLogRequest {

    private String callerId;
    private String calleeId;
    private String roomId;

    @NotNull
    private CallKind kind;

    @NotNull
    private LocalDateTime startedAt;

    private LocalDateTime endedAt;
    private Integer durationSec;

    @NotNull
    private CallOutcome outcome;

    public CallLogRequest() {}

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
}
