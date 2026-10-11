package com.campusconnect.service;

import com.campusconnect.dto.call.CallLogRequest;
import com.campusconnect.dto.call.CallLogResponse;
import com.campusconnect.entity.CallKind;
import com.campusconnect.entity.CallLog;
import com.campusconnect.entity.CallOutcome;
import com.campusconnect.repository.CallLogRepository;
import com.campusconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CallLogSecurityTest {

    @Mock
    private CallLogRepository callLogRepository;

    @Mock
    private UserRepository userRepository;

    private CallLogService callLogService;

    @BeforeEach
    void setUp() {
        callLogService = new CallLogService(callLogRepository, userRepository);
    }

    @Test
    @DisplayName("Enforces authenticated user ID as callerId, overriding any spoofed callerId in request body")
    void callerIdSpoofingPrevention() {
        CallLogRequest request = new CallLogRequest();
        request.setCallerId("spoofed-admin-id");
        request.setCalleeId("user-stu-2");
        request.setRoomId("room-123");
        request.setKind(CallKind.VOICE);
        request.setOutcome(CallOutcome.COMPLETED);
        request.setDurationSec(60);
        request.setStartedAt(LocalDateTime.now().minusMinutes(1));
        request.setEndedAt(LocalDateTime.now());

        when(callLogRepository.save(any(CallLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // The authenticated caller is "user-stu-1"
        CallLogResponse response = callLogService.createCallLog(request, "user-stu-1");

        ArgumentCaptor<CallLog> captor = ArgumentCaptor.forClass(CallLog.class);
        verify(callLogRepository).save(captor.capture());

        CallLog savedLog = captor.getValue();
        // The saved caller ID MUST be "user-stu-1", NOT the spoofed "spoofed-admin-id"
        assertEquals("user-stu-1", savedLog.getCallerId());
        assertEquals("user-stu-1", response.getCallerId());
    }
}
