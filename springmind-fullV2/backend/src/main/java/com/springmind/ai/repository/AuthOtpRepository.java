package com.springmind.ai.repository;

import com.springmind.ai.model.AuthOtp;
import com.springmind.ai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AuthOtpRepository extends JpaRepository<AuthOtp, Long> {
    Optional<AuthOtp> findByChallengeTokenAndVerifiedAtIsNull(String challengeToken);
    void deleteByUserAndVerifiedAtIsNull(User user);
    void deleteByExpiresAtBefore(LocalDateTime expiresAt);
}
