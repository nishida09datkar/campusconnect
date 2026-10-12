package com.campusconnect.repository;

import com.campusconnect.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    List<Course> findByDepartmentId(String departmentId);
    Optional<Course> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
}
