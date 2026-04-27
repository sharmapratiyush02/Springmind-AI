package com.springmind.ai.repository;

import com.springmind.ai.model.PasswordResetToken;
import com.springmind.ai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);
    void deleteByUserAndUsedAtIsNull(User user);
    void deleteByExpiresAtBefore(LocalDateTime expiresAt);
}
