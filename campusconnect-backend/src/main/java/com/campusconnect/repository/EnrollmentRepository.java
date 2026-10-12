package com.campusconnect.repository;

import com.campusconnect.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, String> {
    List<Enrollment> findByClassId(String classId);
    List<Enrollment> findByStudentId(String studentId);
    Optional<Enrollment> findByClassIdAndStudentId(String classId, String studentId);
    boolean existsByClassIdAndStudentId(String classId, String studentId);
    void deleteByClassId(String classId);
}
