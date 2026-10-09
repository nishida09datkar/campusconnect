package com.campusconnect.service;

import com.campusconnect.dto.call.CallLogRequest;
import com.campusconnect.dto.call.CallLogResponse;
import com.campusconnect.entity.CallLog;
import com.campusconnect.entity.CallOutcome;
import com.campusconnect.entity.User;
import com.campusconnect.repository.CallLogRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CallLogService {

    private final CallLogRepository callLogRepository;
    private final UserRepository userRepository;

    public CallLogService(CallLogRepository callLogRepository, UserRepository userRepository) {
        this.callLogRepository = callLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CallLogResponse createCallLog(CallLogRequest req, String currentUserId) {
        CallLog log = new CallLog();
        log.setId("call-" + UUID.randomUUID().toString());
        log.setCallerId(req.getCallerId() != null ? req.getCallerId() : currentUserId);
        log.setCalleeId(req.getCalleeId());
        log.setRoomId(req.getRoomId());
        log.setKind(req.getKind());
        log.setStartedAt(req.getStartedAt() != null ? req.getStartedAt() : LocalDateTime.now());
        log.setEndedAt(req.getEndedAt() != null ? req.getEndedAt() : LocalDateTime.now());
        
        if (req.getDurationSec() != null) {
            log.setDurationSec(req.getDurationSec());
        } else if (log.getStartedAt() != null && log.getEndedAt() != null) {
            long seconds = java.time.Duration.between(log.getStartedAt(), log.getEndedAt()).getSeconds();
            log.setDurationSec((int) Math.max(0, seconds));
        }

        log.setOutcome(req.getOutcome());
        log.setCreatedAt(LocalDateTime.now());

        CallLog saved = callLogRepository.save(log);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CallLogResponse> getUserCallLogs(String userId, CallOutcome outcome, LocalDateTime startDate, LocalDateTime endDate) {
        List<CallLog> logs = callLogRepository.findUserCallLogs(userId, outcome, startDate, endDate);
        return logs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private CallLogResponse mapToResponse(CallLog log) {
        CallLogResponse res = new CallLogResponse();
        res.setId(log.getId());
        res.setCallerId(log.getCallerId());
        res.setCalleeId(log.getCalleeId());
        res.setRoomId(log.getRoomId());
        res.setKind(log.getKind());
        res.setStartedAt(log.getStartedAt());
        res.setEndedAt(log.getEndedAt());
        res.setDurationSec(log.getDurationSec());
        res.setOutcome(log.getOutcome());
        res.setCreatedAt(log.getCreatedAt());

        if (log.getCallerId() != null) {
            userRepository.findById(log.getCallerId())
                    .ifPresent(u -> res.setCallerName(u.getName()));
        }
        if (log.getCalleeId() != null) {
            userRepository.findById(log.getCalleeId())
                    .ifPresent(u -> res.setCalleeName(u.getName()));
        }

        return res;
    }
}
