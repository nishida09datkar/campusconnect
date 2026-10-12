package com.campusconnect.repository;

import com.campusconnect.entity.ClassRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRoomRepository extends JpaRepository<ClassRoom, String> {
    List<ClassRoom> findByFacultyId(String facultyId);
    List<ClassRoom> findByIdIn(List<String> ids);
    Optional<ClassRoom> findByClassCodeIgnoreCase(String classCode);
    boolean existsByClassCodeIgnoreCase(String classCode);
}
