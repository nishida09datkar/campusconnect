package com.campusconnect.repository;

import com.campusconnect.entity.CallLog;
import com.campusconnect.entity.CallOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, String> {

    @Query("SELECT c FROM CallLog c WHERE (c.callerId = :userId OR c.calleeId = :userId) " +
           "AND (:outcome IS NULL OR c.outcome = :outcome) " +
           "AND (cast(:startDate as timestamp) IS NULL OR c.startedAt >= :startDate) " +
           "AND (cast(:endDate as timestamp) IS NULL OR c.startedAt <= :endDate) " +
           "ORDER BY c.startedAt DESC")
    List<CallLog> findUserCallLogs(
            @Param("userId") String userId,
            @Param("outcome") CallOutcome outcome,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
