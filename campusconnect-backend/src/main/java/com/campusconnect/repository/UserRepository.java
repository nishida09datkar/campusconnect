package com.campusconnect.repository;

import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    List<User> findByDepartmentId(String departmentId);
    List<User> findByRole(Role role);
    boolean existsByEmail(String email);
}
