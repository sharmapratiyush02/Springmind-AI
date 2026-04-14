package com.springmind.ai.repository;

import com.springmind.ai.model.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    // ── ADDED: Used by TicketService.generateTicketNumber() ──────────────────
    // Finds the ticket with the highest ticketNumber so we can increment from it.
    // This replaces the static AtomicLong COUNTER which reset to 1000 on every
    // server restart, causing duplicate key violations in PostgreSQL.
    Optional<Ticket> findTopByOrderByTicketNumberDesc();

    Page<Ticket> findByStatus(Ticket.TicketStatus status, Pageable pageable);
    Page<Ticket> findByPriority(Ticket.TicketPriority priority, Pageable pageable);
    Page<Ticket> findByCategory(Ticket.TicketCategory category, Pageable pageable);
    Page<Ticket> findByAssignedAgentId(Long agentId, Pageable pageable);

    // ── Customer-facing queries ───────────────────────────────────────────────
    List<Ticket> findByCustomerEmailOrderByCreatedAtDesc(String email);
    Optional<Ticket> findByTicketNumberAndCustomerEmail(String ticketNumber, String email);

    // ── Search ────────────────────────────────────────────────────────────────
    @Query("""
        SELECT t FROM Ticket t
        WHERE (:status IS NULL OR t.status = :status)
          AND (:priority IS NULL OR t.priority = :priority)
          AND (:category IS NULL OR t.category = :category)
          AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%',:search,'%'))
               OR LOWER(t.customerName) LIKE LOWER(CONCAT('%',:search,'%'))
               OR LOWER(t.ticketNumber) LIKE LOWER(CONCAT('%',:search,'%')))
    """)
    Page<Ticket> search(
        @Param("status")   Ticket.TicketStatus status,
        @Param("priority") Ticket.TicketPriority priority,
        @Param("category") Ticket.TicketCategory category,
        @Param("search")   String search,
        Pageable pageable
    );

    // ── Analytics ─────────────────────────────────────────────────────────────
    long countByStatus(Ticket.TicketStatus status);
    long countBySlaBreachedTrue();

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.slaBreached = false AND (t.status = 'RESOLVED' OR t.status = 'CLOSED')")
    long countSlaCompliant();

    @Query("SELECT AVG(t.predictedResolutionHours) FROM Ticket t WHERE t.resolvedAt IS NOT NULL")
    Double avgResolutionHours();

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.resolvedAt >= :since")
    long countResolvedSince(@Param("since") LocalDateTime since);

    @Query("SELECT t.category, COUNT(t) FROM Ticket t GROUP BY t.category")
    List<Object[]> countByCategory();

    @Query("SELECT t.priority, COUNT(t) FROM Ticket t GROUP BY t.priority")
    List<Object[]> countByPriority();

    @Query("SELECT t.createdAt, COUNT(t) FROM Ticket t WHERE t.createdAt >= :since GROUP BY t.createdAt ORDER BY t.createdAt")
    List<Object[]> dailyVolumeSince(@Param("since") LocalDateTime since);

    @Query("SELECT t FROM Ticket t WHERE t.slaDeadline < :now AND t.slaBreached = false AND t.status NOT IN ('RESOLVED','CLOSED')")
    List<Ticket> findSlaBreachCandidates(@Param("now") LocalDateTime now);
}
