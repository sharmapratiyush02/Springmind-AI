package com.springmind.ai.repository;

import com.springmind.ai.model.User;
import com.springmind.ai.model.UserProgressEmailLog;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProgressEmailLogRepository extends JpaRepository<UserProgressEmailLog, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<UserProgressEmailLog> findByUser(User user);
}
