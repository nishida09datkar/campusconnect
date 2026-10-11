package com.campusconnect.repository;

import com.campusconnect.entity.UserGoogleToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserGoogleTokenRepository extends JpaRepository<UserGoogleToken, String> {
}
