package com.campusconnect.dto.call;

import com.campusconnect.entity.CallKind;
import com.campusconnect.entity.CallOutcome;
import java.time.LocalDateTime;

public class CallLogResponse {

    private String id;
    private String callerId;
    private String callerName;
    private String calleeId;
    private String calleeName;
    private String roomId;
    private CallKind kind;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer durationSec;
    private CallOutcome outcome;
    private LocalDateTime createdAt;

    public CallLogResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCallerId() { return callerId; }
    public void setCallerId(String callerId) { this.callerId = callerId; }

    public String getCallerName() { return callerName; }
    public void setCallerName(String callerName) { this.callerName = callerName; }

    public String getCalleeId() { return calleeId; }
    public void setCalleeId(String calleeId) { this.calleeId = calleeId; }

    public String getCalleeName() { return calleeName; }
    public void setCalleeName(String calleeName) { this.calleeName = calleeName; }

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
