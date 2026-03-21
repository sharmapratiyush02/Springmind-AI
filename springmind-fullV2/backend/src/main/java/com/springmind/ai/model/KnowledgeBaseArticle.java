package com.springmind.ai.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kb_articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeBaseArticle {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    private Ticket.TicketCategory category;

    @Column(length = 500)
    private String tags;

    @Builder.Default
    private Integer viewCount = 0;

    @Builder.Default
    private Integer helpfulVotes = 0;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
