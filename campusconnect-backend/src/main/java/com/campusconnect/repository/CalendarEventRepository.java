package com.campusconnect.repository;

import com.campusconnect.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, String> {
    List<CalendarEvent> findByDepartmentId(String departmentId);
    List<CalendarEvent> findByCreatorId(String creatorId);
    List<CalendarEvent> findByClassId(String classId);
}
