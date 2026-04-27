package com.springmind.ai.repository;

import com.springmind.ai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByActiveTrue();

    @Query("""
        SELECT u.fullName, u.email,
               COUNT(t.id),
               SUM(CASE WHEN t.status = 'RESOLVED' OR t.status = 'CLOSED' THEN 1 ELSE 0 END)
        FROM User u
        LEFT JOIN Ticket t ON t.assignedAgent = u
        WHERE u.active = true
        GROUP BY u.id, u.fullName, u.email
    """)
    List<Object[]> agentPerformanceStats();
}
