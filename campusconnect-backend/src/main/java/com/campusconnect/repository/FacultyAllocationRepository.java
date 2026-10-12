package com.campusconnect.repository;

import com.campusconnect.entity.FacultyAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyAllocationRepository extends JpaRepository<FacultyAllocation, String> {
    List<FacultyAllocation> findByFacultyId(String facultyId);
    List<FacultyAllocation> findByCourseId(String courseId);
    Optional<FacultyAllocation> findByFacultyIdAndCourseId(String facultyId, String courseId);
    boolean existsByFacultyIdAndCourseId(String facultyId, String courseId);
}
