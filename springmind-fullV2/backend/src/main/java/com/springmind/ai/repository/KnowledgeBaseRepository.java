package com.springmind.ai.repository;

import com.springmind.ai.model.KnowledgeBaseArticle;
import com.springmind.ai.model.Ticket;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBaseArticle, Long> {

    List<KnowledgeBaseArticle> findByCategory(Ticket.TicketCategory category);

    @Query("SELECT a FROM KnowledgeBaseArticle a WHERE LOWER(a.title) LIKE LOWER(CONCAT('%',:kw,'%')) OR LOWER(a.tags) LIKE LOWER(CONCAT('%',:kw,'%'))")
    List<KnowledgeBaseArticle> searchByKeyword(@Param("kw") String keyword, Pageable pageable);
}
