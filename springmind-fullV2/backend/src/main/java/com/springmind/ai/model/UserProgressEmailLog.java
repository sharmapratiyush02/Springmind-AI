package com.springmind.ai.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_progress_email_logs", indexes = {
    @Index(name = "idx_progress_email_user", columnList = "user_id", unique = true),
    @Index(name = "idx_progress_email_due", columnList = "last_sent_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProgressEmailLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "last_sent_at")
    private LocalDateTime lastSentAt;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
